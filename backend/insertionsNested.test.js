import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import User from './models/user.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import multer from "multer"

async function cleanDB() {
    const collections = mongoose.connection.collections

    for (const key in collections) {
        await collections[key].deleteMany()
    }
}

let mongoServer

describe("POST /api/v1/parkings/:parkId/insertions", () => {
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
        const res = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        const resFake = await request(app).post('/api/v1/users').send({
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
            .post('/api/v1/parkings')
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
            .post('/api/v1/parkings')
            .set("Authorization", tokenFake)
            .field("json", jsonstrFake)
            .attach("image", "./static/img/logo.png")
        parkFakeId = parkFakeId.header.location.split("parkings/")[1]
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test("POST /api/v1/parkings/:parkId/insertions with non-existing parking in DB respond with 404", async () => {
        const res = await request(app)
            .post('/api/v1/parkings/100/insertions')
            .set("Authorization", token)
            .expect(404, { message: "Parking not found" });
    })

    test("POST /api/v1/parkings/:parkId/insertions parking of another user should respond with 403", async () => {
        const res = await request(app)
            .post('/api/v1/parkings/'+parkFakeId+'/insertions')
            .set("Authorization", token)
            .expect(403, { message: "User is not authorized to perform this action" });
    })

    test("POST /api/v1/parkings/:parkId/insertions omitting a field", async () => {
        const res = await request(app)
            .post('/api/v1/parkings/'+parkId+'/insertions')
            .set("authorization", token)
            .send({
                //name: "insertion name", 
                datetimeStart: "2022-06-06T08:00:00.000+00:00", 
                datetimeEnd: "2022-07-06T08:00:00.000+00:00", 
                priceHourly: 10, 
                priceDaily: 100,
            })
            .expect(400, { message: 'Some fields are empty or undefined' })
    })
    
    test("POST /api/v1/parkings/:parkId/insertions with some fields empty should respond with 201", async () => {
        const res = await request(app)
            .post('/api/v1/parkings/'+parkId+'/insertions')
            .set("authorization", token)
            .send({
                name: "insertion name", 
                datetimeStart: "2022-06-06T08:00:00.000+00:00", 
                datetimeEnd: "2022-07-06T08:00:00.000+00:00", 
                priceHourly: 10, 
                priceDaily: 100,
            })
            .expect(201).expect("location", /\/api\/v1\/\insertions\/(.*)/)
    })
})

describe("GET /api/v1/parkings/:parkId/insertions", () => {
    let userId
    let parkId
    let payload 
    let token
    
    beforeAll(async () => {
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

        let jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: ""
        })
        parkId = await request(app)
            .post('/api/v1/parkings')
            .set("Authorization", token)
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
        parkId = parkId.header.location.split("parkings/")[1]
        await request(app)
            .post('/api/v1/parkings/'+parkId+'/insertions')
            .set("authorization", token)
            .send({
                name: "insertion name", 
                datetimeStart: "2022-06-06T08:00:00.000+00:00", 
                datetimeEnd: "2022-07-06T08:00:00.000+00:00", 
                priceHourly: 10, 
                priceDaily: 100,
            })
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
    })

    test("GET /api/v1/parkings/:parkId/insertions with non-existing parking", async () => {
        const res = request(app)
            .get("/api/v1/parkings/100/insertions")
            .set("Authorization", token)
            .expect(404, { message: "Parking not found" })
    })

    test("GET /api/v1/parkings/:parkId/insertions with non-existing parking", async () => {
        const res = await request(app)
            .get("/api/v1/parkings/" + parkId + "/insertions")
            .set("Authorization", token)
            .expect(200)
        if(res.body) {
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