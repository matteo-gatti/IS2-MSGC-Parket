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
            .field("json", jsonstr)
            .attach("image", "./static/img/logo.png")
            .set('content-type', 'multipart/form-data').expect(401, { auth: false, message: 'Token missing or invalid' })
    })
})

describe("GET /api/v1/parkings/myParkings", () => {
    beforeAll(async () => {
        jest.setTimeout(5000);
        //mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
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
        //mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
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
        console.log("idp", idPark)

        await request(app)
            .post('/api/v1/parkings/' + idPark + '/insertions')
            .set("Authorization", token)
            .send({
                name: "insertion name",
                datetimeStart: "2022-06-06T08:00:00.000+00:00",
                datetimeEnd: "2022-07-06T08:00:00.000+00:00",
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
                datetimeStart: "2022-06-06T08:00:00.000+00:00",
                datetimeEnd: "2022-07-06T08:00:00.000+00:00",
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