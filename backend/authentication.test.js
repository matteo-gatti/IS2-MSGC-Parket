import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import User from './models/user.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

async function cleanDB() {
    const collections = mongoose.connection.collections

    for (const key in collections) {
        await collections[key].deleteMany()
    }
}

let mongoServer

describe("POST /api/v1/auth/login", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        await request(app).post('/api/v1/users').send({
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

    test("POST with wrong username", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            identifier: "wrongtest",
            password: "wrongtest",
        }).expect(401).expect("Content-Type", /json/)
        expect(response.body).toBeDefined()
        expect(response.body.message).toBe('Wrong identifier or password')
    })

    test("POST with wrong password", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            identifier: "test",
            password: "wrongtest",
        }).expect(401).expect("Content-Type", /json/)
        expect(response.body).toBeDefined()
        expect(response.body.message).toBe('Wrong identifier or password')
    })

    test("POST with correct credentials", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            identifier: "test",
            password: "test",
        }).expect(200).expect("Content-Type", /json/);
        if (response.body && response.body[0]) {
            expect(response.body[0]).toEqual({ auth: true, token: /(.*)/, self: /\/api\/v1\/users\/(.*)/, })
        }
    })

})

describe("POST /api/v1/auth/logout", () => {
    
        beforeAll(async () => {
            mongoServer = await MongoMemoryServer.create()
            app.locals.db = await mongoose.connect(mongoServer.getUri())
            await cleanDB()
            await request(app).post('/api/v1/users').send({
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
    
        // the same test as user is or is not logged in, just checking it returns a token
        test("POST logout", async () => {
            const response = await request(app).post("/api/v1/auth/logout").send({
                identifier: "test",
                password: "test",
            }).expect(200)
            if (response.body && response.body[0]) {
                expect(response.body[0]).toEqual({ auth: false, token: /(.*)/, })
            }
            // check if the token is invalidated
            const response2 = await request(app).get("/api/v1/users/100").send({
                token: response.body.token,
            }).expect(401)
            if (response2.body && response2.body[0]) {
                expect(response2.body[0]).toEqual({ auth: false, message: 'Token missing or invalid', })
            }
        })
        
})