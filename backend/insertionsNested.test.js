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

describe("POST /api/v2/parkings/:parkId/insertions", () => {
    let userId
    let fakeId
    let parkId
    let parkFakeId
    let payload
    let payloadFake
    let token
    let tokenFake
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        const res = await request(app).post('/api/v2/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        const resFake = await request(app).post('/api/v2/users').send({
            username: "fake",
            password: "fake",
            email: "fake@fake",
            name: "fake",
            surname: "fake",
        })
        userId = res.header.location.split("users/")[1]
        fakeId = resFake.header.location.split("users/")[1]
        payload = {
            userId: userId,
            email: "test@test",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        payloadFake = {
            userId: fakeId,
            email: "fake@fake",
        }
        tokenFake = jwt.sign(payloadFake, process.env.SUPER_SECRET, {
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
        parkId = await request(app)
            .post('/api/v2/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
        parkId = parkId.header.location.split("parkings/")[1]

        let jsonstrFake = JSON.stringify({
            name: "parkingFake",
            address: "addressFake",
            city: "cityFake",
            country: "countryFake",
            description: "descriptionFake",
            image: ""
        })
        parkFakeId = await request(app)
            .post('/api/v2/parkings')
            .set("Authorization", tokenFake)
            .field("json", jsonstrFake)
            .attach("image", "./static/img/logo.png")
        parkFakeId = parkFakeId.header.location.split("parkings/")[1]
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        console.log("CONN", mongoose.connection.readyState);

        const directory = './static/uploads';

        const fileNames = await fs.promises.readdir(directory)

        for (const file of fileNames) {
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        }
    })

    test("POST /api/v2/parkings/:parkId/insertions with non-existing parking in DB respond with 404", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/100/insertions')
            .set("Authorization", token)
            .expect(404, { message: "Parking not found" });
    })

    test("POST /api/v2/parkings/:parkId/insertions parking of another user should respond with 403", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/' + parkFakeId + '/insertions')
            .set("Authorization", token)
            .expect(403, { message: "User is not authorized to perform this action" });
    })

    test("POST /api/v2/parkings/:parkId/insertions omitting a field", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/' + parkId + '/insertions')
            .set("authorization", token)
            .send({
                //name: "insertion name", 
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                priceHourly: 10,
                priceDaily: 100,
            })
            .expect(400, { message: 'Some fields are empty or undefined' })
    })

    test("POST /api/v2/parkings/:parkId/insertions with some fields empty should respond with 201", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/' + parkId + '/insertions')
            .set("authorization", token)
            .send({
                name: "insertion name",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                priceHourly: 10,
                priceDaily: 100,
            })
            .expect(201).expect("location", /\/api\/v2\/\insertions\/(.*)/)
    })
})

describe("GET /api/v2/parkings/:parkId/insertions", () => {
    let userId
    let parkId
    let payload
    let token

    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        const res = await request(app).post('/api/v2/users').send({
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

        let jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: ""
        })
        parkId = await request(app)
            .post('/api/v2/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
        parkId = parkId.header.location.split("parkings/")[1]
        await request(app)
            .post('/api/v2/parkings/' + parkId + '/insertions')
            .set("authorization", token)
            .send({
                name: "insertion name",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                priceHourly: 10,
                priceDaily: 100,
            })
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        await mongoServer.stop()
    })

    test("GET /api/v2/parkings/:parkId/insertions with non-existing parking", async () => {
        expect.assertions(0);
        const res = await request(app)
            .get("/api/v2/parkings/100/insertions")
            .set("Authorization", token)
            .expect(404, { message: "Parking not found" })
    })

    test("GET /api/v2/parkings/:parkId/insertions with non-existing parking", async () => {
        expect.assertions(1)
        const res = await request(app)
            .get("/api/v2/parkings/" + parkId + "/insertions")
            .set("Authorization", token)
            .expect(200)
        if (res.body) {
            expect(res.body).toEqual(expect.objectContaining({
                _id: expect.any(String),
                insertions: [{
                    self: expect.any(String),
                    name: expect.any(String),
                    datetimeStart: expect.anything(),
                    datetimeEnd: expect.anything(),
                    priceHourly: expect.any(Number),
                    priceDaily: expect.any(Number),
                    reservations: [],
                    minInterval: expect.anything(),
                    recurrent: expect.any(Boolean)
                }],
            }))
        }
    })

})