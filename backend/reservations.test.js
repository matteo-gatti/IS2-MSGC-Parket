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

describe("GET /api/v1/reservations/myReservations", () => {
    let userId
    let userId2
    let token
    let token2
    let parkId
    let insertionId

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

        const tmpRes2 = await request(app).post('/api/v1/users').send({
            username: "test2",
            password: "test2",
            email: "test2@test2",
            name: "test2",
            surname: "test2",
        })

        userId2 = tmpRes2.header.location.split("users/")[1]

        const payload2 = {
            userId: userId2,
            email: "test2@test2",
        }
        token2 = jwt.sign(payload2, process.env.SUPER_SECRET, {
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
            datetimeStart: "2022-06-06T08:00:00.000+00:00",
            datetimeEnd: "2022-07-06T08:00:00.000+00:00",
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

        parkId = ((res.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId = ((res.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]

        expect.assertions(0)

        await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", token2)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+00:00",
                datetimeEnd: "2022-06-10T11:00:00.000+00:00",
            })
            .expect(201).expect("location", /\/api\/v1\/reservations\/(.*)/)
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
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        }
    })

    test("GET /api/v1/reservations/myReservations with non-exisisting user, should respond with 404", async () => {
        expect.assertions(0)
        const res = await request(app)
            .get('/api/v1/reservations/myReservations')
            .set("authorization", jwt.sign({ userId: "1000", email: "test@ciaoo" }, process.env.SUPER_SECRET, {
                expiresIn: 86400 // expires in 24 hours
            }))
            .expect(404, { message: "User not found" })

    })

    test("GET /api/v1/reservations/myReservations without authentication, should respond with 401", async () => {
        expect.assertions(0)
        const res = await request(app)
            .get('/api/v1/reservations/myReservations')
            .expect(401, { auth: false, message: 'Token missing or invalid' })

    })

    test("GET /api/v1/reservations/myReservations, should respond with 200 and a list of reservations", async () => {
        expect.assertions(1)
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        const res = await request(app)
            .get('/api/v1/reservations/myReservations')
            .set("authorization", token2)
            .expect(200)

        if (res.body && res.body[0]) {
            expect(res.body[0]).toMatchObject({
                self: expect.any(String),
                client: expect.any(String),
                insertion: {
                    self: expect.any(String),
                    name: expect.any(String),
                },
                datetimeStart: expect.any(String),
                datetimeEnd: expect.any(String),
                price: expect.any(Number),
            })
        }

    })
})