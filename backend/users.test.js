/* import express from 'express'
import bcrypt from 'bcrypt'

import User from './models/user.js'
import Reservation from './models/reservation.js'

import config from '../config.js'
import tokenChecker from './tokenChecker.js'
 */
import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import User from './models/user.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

/* describe("POST /api/v1/users", () => {
    let mockUser
    beforeAll(() => {
        mockUser = jest.spyOn(User.prototype, "save").mockImplementation(() => { id: 100 })
    });

    test("POST /api/v1/users/ with correct data should respond with a success message", async () => {
        let res = await request(app).post('/api/v1/users').send({ username: "ciao", password: "passCiao", name: "ciao", surname: "ciao", email: "ciao" })
            .expect("Content-Type", /json/).expect(201).expect("Location", "/api/users/100");
    });
}) */
async function cleanDB() {
    const collections = mongoose.connection.collections

    for (const key in collections) {
        await collections[key].deleteMany()
    }
}
let mongoServer
describe("POST /api/v1/users", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
    });

    beforeEach(async () => {
        await cleanDB()
    });

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close(true)
    });

    test("POST /api/v1/users/ without username should respond with an error message", async () => {
        const res = await request(app).post('/api/v1/users').send({ password: "passCiao", name: "ciao", surname: "ciao", email: "ciao" })
        .expect(400).expect("Content-Type", /json/)
        if (res.body && res.body[0])
            expect(res.body[0], { message: 'Some fields are empty or undefined' });
    });

    test("POST /api/v1/users/ without password should respond with an error message", async () => {
        const res = await request(app).post('/api/v1/users').send({ username: "ciao", name: "ciao", surname: "ciao", email: "ciao" })
        .expect(400).expect("Content-Type", /json/)
        if (res.body && res.body[0])
            expect(res.body[0], { message: 'Some fields are empty or undefined' });
    });

    test("POST /api/v1/users/ with already used username should respond with a 409 and error message", async () => {
        await request(app).post('/api/v1/users').send({ username: "ciao", password: "passCiao", name: "ciao", surname: "ciao", email: "ciao" })
        const res = await request(app).post('/api/v1/users').send({ username: "ciao", password: "passCiao2", name: "ciao2", surname: "ciao2", email: "ciao2" })
        .expect(409).expect("Content-Type", /json/)
        if (res.body && res.body[0])
            expect(res.body[0], { message: 'Username or email already exists' });
    });

    test("POST /api/v1/users/ with correct data should respond with a success message", async () => {
        await request(app).post('/api/v1/users').send({ username: "ciao", password: "passCiao", name: "ciao", surname: "ciao", email: "ciao" })
            .expect(201).expect("location", /\/api\/v1\/users\/(.*)/);
    });
}) 

/* // Create a new user
router.post('', async (req, res) => {
    const user = new User(req.body)

    // If password is not provided, return error
    if (!req.body.password) {
        return res.status(400).send({ message: 'Some fields are empty or undefined' })
    }
    
    // Hash the password
    user.password = await bcrypt.hash(user.password, stage.saltingRounds)

    try {
        let newUser = await user.save()
        newUser.self = "/api/v1/users/" + newUser._id

        let userId = newUser._id
        
        await newUser.save()

        // link to the newly created resource is returned in the location header
        return res.location('/api/v1/users/' + userId).status(201).send()
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(409).json({ message: "Username or email already exists" })
        }
        return res.status(400).json({ message: "Some fields are empty or undefined" })
    }
}) */

describe("GET /api/v1/users/:userid", () => {
    beforeAll(async () => {
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        await request(app).post('/api/v1/users').send({ username: 'pollino22', password: "random", name: 'matteo', surname: 'circa', email: 'matte@circa.com'})
    });

    afterAll(async () => { await mongoose.connection.close(true) });

    var payload = {
        userId: "pollino22",
        email: "matteo@circa.com",
    }
    const token = jwt.sign(payload, process.env.SUPER_SECRET, {
        expiresIn: 86400 // expires in 24 hours
    });

    payload = {
        userId: "fakepollino",
        email: "matteo@circa.com",
    }
    const faketoken = jwt.sign(payload, process.env.SUPER_SECRET, {
        expiresIn: 86400 // expires in 24 hours
    });

    test("GET /api/v1/users/:userid should respond with the user info", async () => {
        let res = await request(app).get('/api/v1/users/100').set("Authorization", token).expect("Content-Type", /json/)
        if (res.body && res.body[0]) {
            expect(res.body[0]).toEqual({ self: /\/api\/v1\/users\/(.*)/, username: 'pollino22', password: "random", name: 'matteo', surname: 'circa', email: 'matte@circa.com', parkings: [] })
        }

    });

    test("GET /api/v1/users/:userid should respond with 401 with token missing", async () => {
        await request(app).get('/api/v1/users/100').expect(401, { auth: false, message: 'Token missing or invalid' });
    });

    test("GET /api/v1/users/:userid should respond with 403 with wrong token", async () => {
        await request(app).get('/api/v1/users/100').set("Authorization", faketoken).expect(403, { message: 'User is not authorized to do this action' });
    });
})

/* describe("GET /api/v1/users/:userid", () => {
    let mockUser
    beforeAll(() => {
        mockUser = jest.spyOn(User, "findById").mockImplementation((criterias) => {
            return [{ self: "/api/v1/users/100", username: 'pollino22', password: "random", name: 'matteo', surname: 'circa', email: 'matte@circa.com', parkings: [] }]
        })
    });

    afterAll(async () => { mockUser.mockRestore() });

    var payload = {
        userId: "pollino22",
        email: "matteo@circa.com",
    }
    const token = jwt.sign(payload, process.env.SUPER_SECRET, {
        expiresIn: 86400 // expires in 24 hours
    });

    payload = {
        userId: "fakepollino",
        email: "matteo@circa.com",
    }
    const faketoken = jwt.sign(payload, process.env.SUPER_SECRET, {
        expiresIn: 86400 // expires in 24 hours
    });

    test("GET /api/v1/users/:userid should respond with the user info", async () => {
        let res = await request(app).get('/api/v1/users/100').set("Authorization", token).expect("Content-Type", /json/)
        if (res.body && res.body[0]) {
            expect(res.body[0]).toEqual({ self: "/api/v1/users/100", username: 'pollino22', password: "random", name: 'matteo', surname: 'circa', email: 'matte@circa.com', parkings: [] })
        }

    });

    test("GET /api/v1/users/:userid should respond with 401 with token missing", async () => {
        await request(app).get('/api/v1/users/100').expect(401, { auth: false, message: 'Token missing or invalid' });
    });

    test("GET /api/v1/users/:userid should respond with 403 with wrong token", async () => {
        await request(app).get('/api/v1/users/100').set("Authorization", faketoken).expect(403, { message: 'User is not authorized to do this action' });
    });
}) */
/*
// Get all reservations of a user
router.get('/:userId/reservations', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    try {
        const reservations = await Reservation.find({ client: { $eq: req.params.userId } }, { _id: 0, __v: 0, client: 0 })
        console.log("Printing user's reservations", reservations)
        return res.status(200).json(reservations)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'User not found' })
    }
})

// Update a user
router.put('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return

    let validFields = ["name", "surname", "password", "email"]
    for (let field in req.body) {
        if (!validFields.includes(field)) {
            return res.status(400).send({ message: "Some fields cannot be modified or do not exist" })
        }
    }

    if (req.body["password"]) {
        req.body["password"] = await bcrypt.hash(req.body["password"], stage.saltingRounds)
    }
    
    try {
        await User.findByIdAndUpdate(req.params.userId, req.body, { runValidators: true })
        return res.status(200).send({ message: 'Update successful' })
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(409).send({ message: "Email is already in use" })
        }
        return res.status(404).send({ message: 'User not found' })
    }
})

// Delete a user
router.delete('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    try {
        await User.findByIdAndDelete((req.params.userId))
        return res.status(200).send({ message: 'User deleted' })
    } catch {
        return res.status(404).send({ message: 'User not found' })
    }
})

export { router as users } */