//testing delle recensioni
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

describe("POST /api/v2/parkings/:parkId/reviews", () => {
    let userId
    let userClientId
    let parkId
    let insertionId
    let token
    let tokenClient
    let reservId

    beforeAll(async () => {
        jest.setTimeout(5000);
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())

        const tmpRes = await request(app).post('/api/v2/users').send({
            username: "testReviews",
            password: "testReviews",
            email: "testReviews@testReviews",
            name: "testReviews",
            surname: "testReviews",
        }).expect(201)
        userId = tmpRes.header.location.split("users/")[1]
        const payload = {
            userId: userId,
            email: "testReviews@testReviews",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const tmpResClient = await request(app).post('/api/v2/users').send({
            username: "clientReviews",
            password: "clientReviews",
            email: "clientReviews@clientReviews",
            name: "clientReviews",
            surname: "clientReviews",
        }).expect(201)
        userClientId = tmpResClient.header.location.split("users/")[1]
        const payloadClient = {
            userId: userClientId,
            email: "clientReviews@clientReviews",
        }
        tokenClient = jwt.sign(payloadClient, process.env.SUPER_SECRET, {
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
            .post('/api/v2/insertions')
            .set("Authorization", token)
            .field("parking", jsonstr)
            .field("insertion", jsonInsertion)
            .attach("image", "./static/img/logo.png")
            .expect(201)

        parkId = ((res.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId = ((res.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]
        expect.assertions(0)

        reservId = await request(app)
            .post('/api/v2/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2100-06-10T09:00:00.000+02:00",
                datetimeEnd: "2100-06-10T10:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v2\/reservations\/(.*)/)
        reservId = reservId.header.location.split("reservations/")[1]

        const res2 = await request(app)
            .get('/success?insertion=' + insertionId + "&reservation=" + reservId)
            .set("Authorization", tokenClient)
            .expect(201)
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test("POST /api/v2/parkings/:parkId/reviews with non-existing parking, should respond with 404", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/10000000/reviews')
            .set("Authorization", tokenClient)
            .send({
                stars: 5,
                description: "comment",
                title: "title",
                reservation: reservId
            })
            .expect(404, { message: "Parking not found" })
    })


    test("POST /api/v2/parkings/:parkId/reviews with wrong token, should respond with 403", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/' + parkId + '/reviews')
            .set("Authorization", token)
            .send({
                stars: 5,
                description: "comment",
                title: "title",
                reservation: reservId
            })
            .expect(403, { message: "You are not the reservation owner" })
    })

    test("POST /api/v2/parkings/:parkId/reviews with wrong fields, should respond with 400", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/' + parkId + '/reviews')
            .set("Authorization", tokenClient)
            .send({
                stars: 5,
                description: "comment",
                title: "title",
                reservation: reservId,
                ciaoMamma: "sono famoso!"
            })
            .expect(400, { message: 'Some fields are invalid' })
    })

    //create valid review with location of the new review
    test("POST /api/v2/parkings/:parkId/reviews with valid fields, should respond with 201", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v2/parkings/' + parkId + '/reviews')
            .set("Authorization", tokenClient)
            .send({
                stars: 5,
                description: "comment",
                title: "title",
                reservation: reservId
            })
            .expect(201).expect("location", /\/api\/v2\/parkings\/(.*)\/reviews\/(.*)/)
    })


})

describe("GET /api/v2/parkings/:parkId/reviews", () => {
    let userId
    let userClientId
    let userClient2Id
    let parkId
    let insertionId
    let token
    let tokenClient
    let tokenClient2
    let reservId
    let reviewId

    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())

        const tmpRes = await request(app).post('/api/v2/users').send({
            username: "testReviews",
            password: "testReviews",
            email: "testReviews@testReviews",
            name: "testReviews",
            surname: "testReviews",
        }).expect(201)
        userId = tmpRes.header.location.split("users/")[1]
        const payload = {
            userId: userId,
            email: "testReviews@testReviews",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const tmpResClient = await request(app).post('/api/v2/users').send({
            username: "clientReviews",
            password: "clientReviews",
            email: "clientReviews@clientReviews",
            name: "clientReviews",
            surname: "clientReviews",
        }).expect(201)
        userClientId = tmpResClient.header.location.split("users/")[1]
        const payloadClient = {
            userId: userClientId,
            email: "clientReviews@clientReviews",
        }
        tokenClient = jwt.sign(payloadClient, process.env.SUPER_SECRET, {
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
            .post('/api/v2/insertions')
            .set("Authorization", token)
            .field("parking", jsonstr)
            .field("insertion", jsonInsertion)
            .attach("image", "./static/img/logo.png")
            .expect(201)

        parkId = ((res.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId = ((res.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]
        expect.assertions(0)

        reservId = await request(app)
            .post('/api/v2/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2100-06-10T09:00:00.000+02:00",
                datetimeEnd: "2100-06-10T10:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v2\/reservations\/(.*)/)
        reservId = reservId.header.location.split("reservations/")[1]

        const res2 = await request(app)
            .get('/success?insertion=' + insertionId + "&reservation=" + reservId)
            .set("Authorization", tokenClient)
            .expect(201)

        reviewId = await request(app)
            .post('/api/v2/parkings/' + parkId + '/reviews')
            .set("Authorization", tokenClient)
            .send({
                stars: 5,
                description: "comment",
                title: "title",
                reservation: reservId
            })
            .expect(201)
        reviewId = reviewId.header.location.split("reviews/")[1]
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        await mongoServer.stop()

    })

    test("GET /api/v2/parkings/:parkId/reviews with wrong parkId, should respond with 404", async () => {
        expect.assertions(0)
        const res = await request(app)
            .get('/api/v2/parkings/100/reviews')
            .set("Authorization", tokenClient)
            .expect(404, { message: "Parking not found" })
    })

    test("GET /api/v2/parkings/:parkId/reviews with valid request, should respond with 200 and a list of reviews", async () => {
        expect.assertions(1)
        const res = await request(app)
            .get('/api/v2/parkings/' + parkId + '/reviews')
            .set("Authorization", tokenClient)
            .expect(200)

        if (res.body) {
            expect(res.body).toMatchObject({
                reviews: [{
                    stars: 5,
                    description: "comment",
                    title: "title",
                    reservation: expect.any(Object),
                    writer: expect.any(Object),
                }],
                average: 5
            })
        }
    })

})
