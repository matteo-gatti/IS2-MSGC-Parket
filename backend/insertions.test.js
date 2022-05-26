import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import User from './models/user.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import fs from 'fs'
import path from 'path'

async function cleanDB() {
    const collections = mongoose.connection.collections

    for (const key in collections) {
        await collections[key].deleteMany()
    }
}

let mongoServer

describe("GET /api/v1/parkings", () => {
    let userId
    let token

    beforeAll(async () => {
        jest.setTimeout(5000);
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())

        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        userId = tmpRes.header.location.split("users/")[1]
        const payload = {
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
        console.log("CONN", mongoose.connection.readyState);
        await mongoServer.stop()
        console.log("MONGO CONN", mongoServer.state)

        const directory = './static/uploads';

        const fileNames = await fs.promises.readdir(directory)

        for (const file of fileNames) {
            if(file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        }
    })

    test("GET /api/v1/insertions with invalid request, should respond with 400", async () => {
        expect.assertions(0);
        const jsonstr = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        const jsonInsertion = JSON.stringify({
            //name: "insertion name", 
            datetimeStart: "2022-06-06T08:00:00.000+00:00",
            datetimeEnd: "2022-07-06T08:00:00.000+00:00",
            priceHourly: 10,
            priceDaily: 100,
        })

        const res = await request(app)
            .post('/api/v1/insertions')
            .set("Authorization", token)
            .field("parking", jsonstr)
            .field("insertion", jsonInsertion)
            .attach("image", "./static/img/logo.png")
            .expect(400, { message: "Bad request" })

    })

    test("GET /api/v1/insertions with valid request, should respond with 200 and a list of parkings", async () => {
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        expect.assertions(2);

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
            datetimeStart: "2022-06-06T08:00:00.000+00:00",
            datetimeEnd: "2022-07-06T08:00:00.000+00:00",
            priceHourly: 10,
            priceDaily: 100,
        })

        const res = await request(app)
            .post('/api/v1/insertions')
            .set("Authorization", token)
            .field("parking", jsonstr)
            .field("insertion", jsonInsertion)
            .attach("image", "./static/img/logo.png")
            .expect(201)
        const locParking = (res.header.location.split(",")[0]).split(":")[1]
        const locInsertion = (res.header.location.split(",")[1]).split(":")[1]
        console.log("ins park", locInsertion, locParking)
        expect(locParking).toMatch(/\/api\/v1\/parkings\/(.*)/)
        expect(locInsertion).toMatch(/\/api\/v1\/insertions\/(.*)/)
    })
})