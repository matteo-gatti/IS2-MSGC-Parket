import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import Parking from './models/parking.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

import GCloud from './gcloud/gcloud.js'
import Stripe from './stripe/stripe.js'

jest.spyOn(GCloud, 'uploadFile').mockImplementation((file, id) => Promise.resolve());
jest.spyOn(GCloud, 'deleteFile').mockImplementation((file) => Promise.resolve());

jest.spyOn(Stripe, 'create').mockImplementation(() => {
    return Promise.resolve({ url: "https://www.park.et/checkout" })
});


async function cleanDB() {
    //iterate over parkings
    const parkings = await Parking.find({});
    for (let parking of parkings) {
        const imageName = parking.image.split('/')[parking.image.split('/').length - 1];
        await GCloud.deleteFile(imageName);
    }

    const collections = mongoose.connection.collections

    for (const key in collections) {
        await collections[key].deleteMany()
    }
}

let mongoServer

describe("POST /api/v1/parkings", () => {
    let userId
    let payload
    let token
    beforeAll(async () => {
        jest.setTimeout(5000);
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        const res = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        userId = res.header.location.split("users/")[1]
        payload = {
            userId: userId,
            email: "test@test",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test('POST /api/v1/parkings should respond with 201', async () => {
        expect.assertions(0);
        //const file = Buffer.from(['whatever'])
        let jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: ""
        })
        const res = await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
            .set('content-type', 'multipart/form-data').expect(201).expect("location", /\/api\/v1\/parkings\/(.*)/);
    })

    test("POST /api/v1/parkings with some fields empty should respond with 400", async () => {
        //const file = Buffer.from(['whatever'])
        expect.assertions(0)
        let jsonstr = JSON.stringify({
            //name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: ""
        })
        const res = await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
            .set('content-type', 'multipart/form-data').expect(400, { message: "Some fields are empty or undefined" })
    })

    test("POST /api/v1/parkings without token should respond with 401", async () => {
        expect.assertions(0)
        let jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: ""
        })
        try {
            const res = await request(app)
                .post('/api/v1/parkings')
                .set("Authorization", null)
                .field("json", jsonstr)
                .attach("image", "./static/img/logo.png")
                .set('content-type', 'multipart/form-data').expect(401, { auth: false, message: 'Token missing or invalid' })
        } catch (err) {
        }
    })
})

describe("GET /api/v1/parkings/myParkings", () => {
    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test("GET /api/v1/parkings/myParkings without token, should respond with 401", async () => {
        expect.assertions(0)
        const res = await request(app)
            .get('/api/v1/parkings/myParkings')
            .expect(401, { message: 'Token missing or invalid' })
    })

    test("GET /api/v1/parkings/myParkings with valid token but no user in DB, should respond with 404", async () => {
        expect.assertions(0)
        const payload = {
            userId: "test",
            email: "test@test",
        }
        const token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })
        const res = await request(app)
            .get('/api/v1/parkings/myParkings')
            .set('authorization', token)
            .expect(404, { message: 'User not found' })
    })

    test("GET /api/v1/parkings/myParkings with valid request, should respond with 200 and a list of parkings", async () => {
        expect.assertions(1)
        // Preconditions: add a user and a parking
        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        const userId = tmpRes.header.location.split("users/")[1]
        const payload = {
            userId: userId,
            email: "test@test",
        }
        const token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        let jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: ""
        })
        await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")

        const res = await request(app)
            .get('/api/v1/parkings/myParkings')
            .set('authorization', token)
            .expect(200)
            .expect("Content-Type", /json/)
        if (res.body && res.body[0]) {
            expect(res.body[0]).toMatchObject({
                _id: expect.any(String),
                __v: expect.any(Number),
                name: expect.any(String),
                address: expect.any(String),
                city: expect.any(String),
                country: expect.any(String),
                description: expect.any(String),
                image: expect.any(String),
                insertions: expect.any(Array),
                owner: userId,
                self: expect.any(String),
                visible: expect.any(Boolean),
            })
        }
    })
})

describe("GET /api/v1/parkings", () => {
    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test("GET /api/v1/parkings/myParkings with valid request, should respond with 200 and a list of parkings", async () => {
        expect.assertions(1)
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        const userId = tmpRes.header.location.split("users/")[1]
        const payload = {
            userId: userId,
            email: "test@test",
        }
        const token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        let jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        let jsonstr2 = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
            visible: false
        })

        let jsonstr3 = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: ""
        })

        const resPark = await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
        const idPark = resPark.header.location.split("parkings/")[1]

        await request(app)
            .post('/api/v1/parkings/' + idPark + '/insertions')
            .set("Authorization", token)
            .send({
                name: "insertion name",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                priceHourly: 10,
                priceDaily: 100,
            })

        const invisiblePark = await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr2)
            .attach("image", "./static/img/logo.png")
        const invParkId = invisiblePark.header.location.split("parkings/")[1]

        await request(app)
            .post('/api/v1/parkings/' + invParkId + '/insertions')
            .set("Authorization", token)
            .send({
                name: "insertion 2",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                priceHourly: 99,
                priceDaily: 999,
            })

        await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr3)
            .attach("image", "./static/img/logo.png")

        const res = await request(app)
            .get('/api/v1/parkings')
            .set('authorization', token)
            .expect(200)
            .expect("Content-Type", /json/)

        if (res.body && res.body[0]) {
            expect(res.body[0]).toMatchObject({
                _id: expect.any(String),
                name: expect.any(String),
                address: expect.any(String),
                city: expect.any(String),
                country: expect.any(String),
                description: expect.any(String),
                image: expect.any(String),
                insertions: expect.any(Array),
                owner: userId,
                self: expect.any(String),
            })
        }
    })
})

describe("GET /api/v1/parkings with a search filter", () => {
    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test("GET /api/v1/parkings/myParkings?search=pippo&priceMin=10&priceMax=100 with valid request, should respond with 200 and a list of filtered parkings", async () => {
        expect.assertions(1)
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        const userId = tmpRes.header.location.split("users/")[1]
        const payload = {
            userId: userId,
            email: "test@test",
        }
        const token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        let jsonstr = JSON.stringify({
            name: "pippo",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        let jsonstr2 = JSON.stringify({
            name: "samanta",
            address: "address",
            city: "trento",
            country: "country",
            description: "description",
            image: "",
        })

        const resPark = await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
        const idPark = resPark.header.location.split("parkings/")[1]

        const resPark2 = await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr2)
            .attach("image", "./static/img/logo.png")
        const idPark2 = resPark2.header.location.split("parkings/")[1]

        const insertion = await request(app)
            .post('/api/v1/parkings/' + idPark + '/insertions')
            .set("Authorization", token)
            .send({
                name: "insertion",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                priceHourly: 50,
                priceDaily: 50,
            })

        const insertion2 = await request(app)
            .post('/api/v1/parkings/' + idPark2 + '/insertions')
            .set("Authorization", token)
            .send({
                name: "insertion 2",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                priceHourly: 150,
                priceDaily: 150,
            })

        const res = await request(app)
            .get('/api/v1/parkings?search=pippo&priceMin=10&priceMax=100')
            .set('authorization', token)
            .expect(200)
            .expect("Content-Type", /json/)

        if (res.body && res.body.length === 1 && res.body[0]) {
            expect(res.body[0]).toMatchObject({
                _id: idPark,
                name: expect.any(String),
                address: expect.any(String),
                city: expect.any(String),
                country: expect.any(String),
                description: expect.any(String),
                image: expect.any(String),
                insertions: expect.any(Array),
                owner: userId,
                self: expect.any(String),
            })
        }
    })
})

describe("DELETE /api/v1/parkings/:parkingId", () => {
    let userId
    let userId2
    let token
    let token2
    let reservId
    let parkId
    let parkId2
    let insertionId
    let insertionId2

    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())

        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        userId = tmpRes.header.location.split("users/")[1]
        let payload = {
            userId: userId,
            email: "test@test",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const tmpRes2 = await request(app).post('/api/v1/users').send({
            username: "test2",
            password: "test2",
            email: "test2@test2",
            name: "test2",
            surname: "test2",
        })
        userId2 = tmpRes2.header.location.split("users/")[1]
        payload = {
            userId: userId2,
            email: "test2@test2",
        }
        token2 = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        const jsonInsertion = JSON.stringify({
            name: "insertion name",
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
            priceHourly: 10,
            priceDaily: 100,
            minInterval: 60
        })

        const res = await request(app)
            .post('/api/v1/insertions')
            .set("Authorization", token)
            .field("parking", jsonstr)
            .field("insertion", jsonInsertion)
            .attach("image", "./static/img/logo.png")
            .expect(201)

        parkId = ((res.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId = ((res.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]

        const jsonstr2 = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        const jsonInsertion2 = JSON.stringify({
            name: "insertion name",
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
            priceHourly: 10,
            priceDaily: 100,
            minInterval: 60
        })

        const res2 = await request(app)
            .post('/api/v1/insertions')
            .set("Authorization", token2)
            .field("parking", jsonstr2)
            .field("insertion", jsonInsertion2)
            .attach("image", "./static/img/logo.png")
            .expect(201)

        parkId2 = ((res2.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId2 = ((res2.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]
        reservId = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", token2)
            .send({
                datetimeStart: "2100-06-10T09:00:00.000+02:00",
                datetimeEnd: "2100-06-10T10:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v1\/reservations\/(.*)/)

        reservId = reservId.header.location.split("reservations/")[1]

        await request(app)
            .get('/success?insertion=' + insertionId + "&reservation=" + reservId)
            .set("Authorization", token2)
            .expect(201)
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test("DELETE /api/v1/parkings/:parkingId on non existent parking, should respond with 404", async () => {
        expect.assertions(0);
        const res = await request(app)
            .delete('/api/v1/parkings/100')
            .set("Authorization", token)
            .expect(404, { message: "Parking not found" })
    })

    test("DELETE /api/v1/parkings/:parkingId of another user, should respond with 403", async () => {
        expect.assertions(0);

        const res = await request(app)
            .delete(`/api/v1/parkings/${parkId}`)
            .set("Authorization", token2)
            .expect(403, { message: 'User is not authorized to do this action' })
    })

    test("DELETE /api/v1/parkings/:parkingId with invalid request (insertion is reserved), should respond with 400", async () => {
        expect.assertions(0);
        const res = await request(app)
            .delete(`/api/v1/parkings/${parkId}`)
            .set("Authorization", token)
            .expect(400, { message: 'Cannot delete parking with active insertions' })
    })

    test("DELETE /api/v1/parkings/:parkingId with valid request, should respond with 200", async () => {
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        expect.assertions(0);
        const res = await request(app)
            .delete(`/api/v1/parkings/${parkId2}`)
            .set("Authorization", token2)
            .expect(200, { message: 'Parking deleted' })
    })
})


describe("PUT /api/v1/parkings/:parkingId", () => {
    let userId
    let userId2
    let token
    let token2
    let reservId
    let parkId
    let parkId2
    let insertionId
    let insertionId2

    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())

        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        userId = tmpRes.header.location.split("users/")[1]
        let payload = {
            userId: userId,
            email: "test@test",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const tmpRes2 = await request(app).post('/api/v1/users').send({
            username: "test2",
            password: "test2",
            email: "test2@test2",
            name: "test2",
            surname: "test2",
        })
        userId2 = tmpRes2.header.location.split("users/")[1]
        payload = {
            userId: userId2,
            email: "test2@test2",
        }
        token2 = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        const jsonInsertion = JSON.stringify({
            name: "insertion name",
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
            priceHourly: 10,
            priceDaily: 100,
            minInterval: 60
        })

        const res = await request(app)
            .post('/api/v1/insertions')
            .set("Authorization", token)
            .field("parking", jsonstr)
            .field("insertion", jsonInsertion)
            .attach("image", "./static/img/logo.png")
            .expect(201)

        parkId = ((res.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId = ((res.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        await mongoServer.stop()
    })

    test("PUT /api/v1/parkings/:parkingId on non existent parking, should respond with 404", async () => {
        expect.assertions(0);
        const res = await request(app)
            .put('/api/v1/parkings/100')
            .set("Authorization", token)
            .expect(404, { message: "Parking not found" })
    })

    test("PUT /api/v1/parkings/:parkingId of another user, should respond with 403", async () => {
        expect.assertions(0);

        const res = await request(app)
            .put(`/api/v1/parkings/${parkId}`)
            .set("Authorization", token2)
            .expect(403, { message: 'User is not authorized to do this action' })
    })

    test("PUT /api/v1/parkings/:parkingId with invalid request, should respond with 400", async () => {
        expect.assertions(0);
        const res = await request(app)
            .put(`/api/v1/parkings/${parkId}`)
            .set("Authorization", token)
            .field("json", JSON.stringify({
                name: "parking",
                address: "address",
                city: "city",
                country: "country",
                description: "description",
                ciaoMamma: 'guarda come mi diverto'
            }))
            .expect(400, { message: "Some fields cannot be modified or do not exist" })
    })

    test("PUT /api/v1/parkings/:parkingId with valid request, should respond with 200", async () => {
        expect.assertions(0);
        const jsonUpdate = JSON.stringify({
            name: "parkingUpdated",
            address: "address",
            city: "city",
            country: "country",
            description: "description"
        })
        const res = await request(app)
            .put(`/api/v1/parkings/${parkId}`)
            .set("Authorization", token)
            .field("json", jsonUpdate)
            .attach("image", "./static/img/logo.png")
            .expect(200)

        if (res.body && res.body.length === 1 && res.body[0]) {
            expect(res.body[0]).toMatchObject({
                _id: idPark,
                name: "parkingUpdated",
                address: expect.any(String),
                city: expect.any(String),
                country: expect.any(String),
                description: expect.any(String),
                image: expect.any(String),
                insertions: expect.any(Array),
                owner: userId,
                self: expect.any(String),
            })
        }
    })
})