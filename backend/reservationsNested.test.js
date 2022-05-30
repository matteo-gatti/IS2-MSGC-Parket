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

describe("POST /api/v1/insertions/:insertionId/reservations", () => {
    let userId
    let userClientId
    let userClient2Id
    let parkId
    let insertionId
    let token
    let tokenClient
    let tokenClient2

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

        const tmpResClient = await request(app).post('/api/v1/users').send({
            username: "client",
            password: "client",
            email: "client@client",
            name: "client",
            surname: "client",
        })
        userClientId = tmpResClient.header.location.split("users/")[1]
        const payloadClient = {
            userId: userClientId,
            email: "client@client",
        }
        tokenClient = jwt.sign(payloadClient, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const tmpResClient2 = await request(app).post('/api/v1/users').send({
            username: "client2",
            password: "client2",
            email: "client2@client2",
            name: "client2",
            surname: "client2",
        })
        userClient2Id = tmpResClient2.header.location.split("users/")[1]
        const payloadClient2 = {
            userId: userClient2Id,
            email: "client2@client2",
        }
        tokenClient2 = jwt.sign(payloadClient2, process.env.SUPER_SECRET, {
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
            .set("Authorization", tokenClient2)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+00:00",
                datetimeEnd: "2022-06-10T10:00:00.000+00:00",
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

    test("POST /api/v1/insertions/:insertionId/reservations with non-existing insertion, should respond with 404", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/1000/reservations')
            .set("Authorization", token)
            .expect(404, { message: "Insertion not found" })

    })

    test("POST /api/v1/insertions/:insertionId/reservations without authentication, should respond with 403", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/1000/reservations')
            .expect(401, { auth: false, message: 'Token missing or invalid' })

    })

    test("POST /api/v1/insertions/:insertionId/reservations where user is trying to reserve one of his insertions, should respond with 403", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", token)
            .expect(403, { message: "User is not authorized to perform this action" })

    })

    test("POST /api/v1/insertions/:insertionId/reservations where user is trying to reserve invalid timeslot (before the start date), should respond with 400", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2022-06-06T07:00:00.000+00:00",
                datetimeEnd: "2022-07-06T08:00:00.000+00:00",
            })
            .expect(400, { message: "Timeslot not valid" })

    })

    test("POST /api/v1/insertions/:insertionId/reservations where user is trying to reserve invalid timeslot (startdate is after enddate), should respond with 400", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2022-06-06T10:00:00.000+00:00",
                datetimeEnd: "2022-06-06T09:00:00.000+00:00",
            })
            .expect(400, { message: "Timeslot not valid" })

    })

    test("POST /api/v1/insertions/:insertionId/reservations where user is trying to reserve invalid timeslot (already reserved by another user), should respond with 400", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2022-06-10T09:30:00.000+00:00",
                datetimeEnd: "2022-06-10T10:30:00.000+00:00",
            })
            .expect(400, { message: "Insertion is already reserved for this timeslot" })

    })

    test("POST /api/v1/insertions/:insertionId/reservations where user is trying to reserve a timeslot smaller than the minimum timeslot available, should respond with 403", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2022-06-06T08:00:00.000+00:00",
                datetimeEnd: "2022-06-06T08:30:00.000+00:00",
            })
            .expect(400, { message: "Minimum reservation time interval not met" })

    })

    test("POST /api/v1/insertions/:insertionId/reservations with invalid request, should respond with 400", async () => {
        expect.assertions(0)
        const res = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2022-06-06T08:00:00.000+00:00",
                //datetimeEnd: "2022-06-06T09:30:00.000+00:00",
            })
            .expect(400, { message: "Some fields are empty or undefined" })

    })

    test("POST /api/v1/insertions/:insertionId/reservations with valid request, should respond with 200 and a list of parkings", async () => {
        expect.assertions(0)
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        const res = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2022-06-06T09:00:00.000+00:00",
                datetimeEnd: "2022-06-06T10:30:00.000+00:00",
            })
            .expect(201).expect("location", /\/api\/v1\/reservations\/(.*)/)


    })
})