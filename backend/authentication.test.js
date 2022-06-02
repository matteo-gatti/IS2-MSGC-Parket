import request from "supertest"
import app from "./app.js"
import Parking from './models/parking.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

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

describe("POST /api/v2/auth/login", () => {

    beforeAll(async () => {
        jest.setTimeout(5000);
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        await request(app).post('/api/v2/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()

    })

    test("POST with wrong username", async () => {
        expect.assertions(2)
        const response = await request(app).post("/api/v2/auth/login").send({
            identifier: "wrongtest",
            password: "wrongtest",
        }).expect(401).expect("Content-Type", /json/)
        expect(response.body).toBeDefined()
        expect(response.body.message).toBe('Wrong identifier or password')
    })

    test("POST with wrong password", async () => {
        expect.assertions(2)
        const response = await request(app).post("/api/v2/auth/login").send({
            identifier: "test",
            password: "wrongtest",
        }).expect(401).expect("Content-Type", /json/)
        expect(response.body).toBeDefined()
        expect(response.body.message).toBe('Wrong identifier or password')
    })

    test("POST with correct credentials", async () => {
        expect.assertions(1)
        const response = await request(app).post("/api/v2/auth/login").send({
            identifier: "test",
            password: "test",
        })
            .expect("Content-Type", /json/)
            .expect(200)
        if (response.body) {
            expect(response.body).toMatchObject({ auth: true, token: /(.*)/, self: /\/api\/v2\/users\/(.*)/ })
        }
    })

})

describe("POST /api/v2/auth/logout", () => {

    beforeAll(async () => {
        jest.setTimeout(5000);
        //mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        await cleanDB()
        await request(app).post('/api/v2/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        await mongoServer.stop()

    })

    // the same test as user is or is not logged in, just checking it returns a token
    test("POST logout", async () => {
        expect.assertions(2)
        const response = await request(app).post("/api/v2/auth/logout").send({
            identifier: "test",
            password: "test",
        }).expect(200)
        if (response.body) {
            expect(response.body).toMatchObject({ auth: false, token: /(.*)/, })
        }
        // check if the token is invalidated
        const response2 = await request(app).get("/api/v2/users/100").send({
            token: response.body.token,
        }).expect(401)
        if (response2.body) {
            expect(response2.body).toMatchObject({ auth: false, message: 'Token missing or invalid', })
        }
    })

})