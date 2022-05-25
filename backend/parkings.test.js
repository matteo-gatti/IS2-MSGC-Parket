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

/* const mockMulter = jest.mock('multer', () => {
    const multer = () => ({
        any: () => {
            return (req, res, next) => {
                req.body = { json: {
                    name: "parking",
                    address: "address",
                    city: "city",
                    country: "country",
                    description: "description",
                } }
                req.file = {
                        originalname: 'sample.name',
                        mimetype: 'image/png',
                        path: 'sample.url',
                        buffer: Buffer.from(["whatever"]), // this is required since `formData` needs access to the buffer
                }
                return next()
            }
        },
    })
    multer.memoryStorage = () => jest.fn()
    return multer
}) */

describe("POST /api/v1/parkings", () => {
    let userId
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
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        await mongoServer.stop()
    })

    test('POST /api/v1/parkings should respond with 201', async () => {
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
})