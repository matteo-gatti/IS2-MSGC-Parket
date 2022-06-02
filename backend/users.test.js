import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import User from './models/user.js'
import Parking from './models/parking.js'
import Reservation from './models/reservation.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import fs from 'fs'
import path from 'path'

import GCloud from './gcloud/gcloud.js'

jest.spyOn(GCloud, 'uploadFile').mockImplementation((file, id) => Promise.resolve());
jest.spyOn(GCloud, 'deleteFile').mockImplementation((file) => Promise.resolve());

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
describe("POST /api/v1/users", () => {

    beforeAll(async () => {
        jest.setTimeout(5000);
        mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())
    });

    beforeEach(async () => {
        await cleanDB()
    });

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        /* const directory = './static/uploads';

        const fileNames = await fs.promises.readdir(directory)

        for (const file of fileNames) {
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });

            }
        } */
    });

    test("POST /api/v1/users/ without username should respond with an error message", async () => {
        expect.assertions(1)
        const res = await request(app).post('/api/v1/users').send({ password: "passCiao", name: "ciao", surname: "ciao", email: "ciao" })
            .expect(400).expect("Content-Type", /json/)
        if (res.body)
            expect(res.body).toMatchObject({ message: 'Some fields are empty or undefined' });
    });

    test("POST /api/v1/users/ without password should respond with an error message", async () => {
        expect.assertions(1)
        const res = await request(app).post('/api/v1/users').send({ username: "ciao", name: "ciao", surname: "ciao", email: "ciao" })
            .expect(400).expect("Content-Type", /json/)
        if (res.body)
            expect(res.body).toMatchObject({ message: 'Some fields are empty or undefined' });
    });

    test("POST /api/v1/users/ with already used username should respond with a 409 and error message", async () => {
        expect.assertions(1)
        await request(app).post('/api/v1/users').send({ username: "ciao", password: "passCiao", name: "ciao", surname: "ciao", email: "ciao" })
        const res = await request(app).post('/api/v1/users').send({ username: "ciao", password: "passCiao2", name: "ciao2", surname: "ciao2", email: "ciao2" })
            .expect(409).expect("Content-Type", /json/)
        if (res.body)
            expect(res.body).toMatchObject({ message: 'Username or email already exists' });
    });

    test("POST /api/v1/users/ with correct data should respond with a success message", async () => {
        expect.assertions(0)
        await request(app).post('/api/v1/users').send({ username: "ciao", password: "passCiao", name: "ciao", surname: "ciao", email: "ciao" })
            .expect(201).expect("location", /\/api\/v1\/users\/(.*)/);
    });
})

describe("GET /api/v1/users/:userid", () => {
    let userId
    let token
    let faketoken
    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        userId = await request(app).post('/api/v1/users').send({ username: 'pollino22', password: "random", name: 'matteo', surname: 'circa', email: 'matte@circa.com' })
        userId = userId.header.location.split("users/")[1]
        var payload = {
            userId: userId,
            email: "matteo@circa.com",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        });
        payload = {
            userId: "fakepollino",
            email: "matteo@circa.com",
        }
        faketoken = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        });
    });

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
            ;

        /* const directory = './static/uploads';

        const fileNames = await fs.promises.readdir(directory)

        for (const file of fileNames) {
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });

            }
        } */
    });

    test("GET /api/v1/users/:userid should respond with the user info", async () => {
        expect.assertions(1)
        let res = await request(app).get('/api/v1/users/' + userId).set("Authorization", token).expect("Content-Type", /json/)
            .expect(200)
        if (res.body) {
            expect(res.body).toMatchObject({ self: /\/api\/v1\/users\/(.*)/, username: 'pollino22', name: 'matteo', surname: 'circa', email: 'matte@circa.com', parkings: [] })
        }

    });

    test("GET /api/v1/users/:userid should respond with 401 with token missing", async () => {
        expect.assertions(0)
        await request(app).get('/api/v1/users/100').expect(401, { auth: false, message: 'Token missing or invalid' });
    });

    test("GET /api/v1/users/:userid should respond with 403 with wrong token", async () => {
        expect.assertions(0)
        await request(app).get('/api/v1/users/100').set("Authorization", faketoken).expect(403, { message: 'User is not authorized to do this action' });
    });
})

describe("GET /api/v1/users/:userid/reservations", () => {
    let mockUser
    let mockReserv
    let payload
    let token
    beforeAll(async () => {
        jest.setTimeout(5000);
        app.locals.db = await mongoose.connect(mongoServer.getUri())
        await cleanDB()
        mockUser = await request(app).post('/api/v1/users').send({ username: 'pollino22', password: "random", name: 'matteo', surname: 'circa', email: 'matteo@circa.com' })

        mockUser = mockUser.header.location.split("users/")[1]
        mockReserv = jest.spyOn(Reservation, "find").mockImplementation((criterias) => {
            let ret = [{
                datetimeStart: "2100-05-31T11:34:00.000+02:00",
                datetimeEnd: "2100-05-31T14:34:00.000+02:00",
                insertion: "ObjID",
                price: 3,
                self: "/api/v1/reservations/sjdlkasdjsd"

            },
            {
                datetimeStart: "2100-06-31T11:34:00.000+02:00",
                datetimeEnd: "2100-06-31T14:34:00.000+02:00",
                insertion: "ObjID",
                price: 7,
                self: "/api/v1/reservations/asdasdad"
            }
            ];
            return ret
        })
        payload = {
            userId: '' + mockUser,
            email: "matteo@circa.com",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        });
    });

    afterAll(async () => {
        mockReserv.mockRestore()
        await cleanDB()
        await mongoose.connection.close()
        await mongoServer.stop()


        /* const directory = './static/uploads';

        const fileNames = await fs.promises.readdir(directory)

        for (const file of fileNames) {
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });

            }
        } */
    });

    test("GET /api/v1/users/:userid/reservations should respond with 200 and a list of reservations", async () => {
        expect.assertions(0)
        const res = await request(app).get('/api/v1/users/' + mockUser + '/reservations').set("Authorization", token).expect(200)//, { message: 'User is not authorized to do this action' });
    })
})