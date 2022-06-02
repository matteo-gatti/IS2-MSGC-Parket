import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import User from './models/user.js'
import Parking from './models/parking.js'
import Reservation from './models/reservation.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import path from 'path'

const googleStorage = new Storage();

async function deleteFile(fileName) {
    await googleStorage.bucket('parket-pictures').file(fileName).delete();
}

async function cleanDB() {
    //iterate over parkings
    const parkings = await Parking.find({});
    for (let parking of parkings) {
        const imageName = parking.image.split('/')[parking.image.split('/').length - 1];
        await deleteFile(imageName);
    }

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
            datetimeStart: "2022-06-06T08:00:00.000+02:00",
            datetimeEnd: "2022-07-06T08:00:00.000+02:00",
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

        await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", token2)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+02:00",
                datetimeEnd: "2022-06-10T11:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v1\/reservations\/(.*)/)
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        //await mongoServer.stop()


        /* const directory = './static/uploads';

        const fileNames = await fs.promises.readdir(directory)

        for (const file of fileNames) {
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });

            }
        } */
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

describe("DELETE /api/v1/reservations/:insertionId/", () => {
    let userId
    let userClientId
    let parkId
    let insertionId
    let token
    let tokenClient
    let reservId

    beforeAll(async () => {
        jest.setTimeout(5000);
        //mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())

        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "testDelete",
            password: "testDelete",
            email: "testDelete@testDelete",
            name: "testDelete",
            surname: "testDelete",
        })
        userId = tmpRes.header.location.split("users/")[1]
        const payload = {
            userId: userId,
            email: "testDelete@testDelete",
        }
        token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const tmpResClient = await request(app).post('/api/v1/users').send({
            username: "clientDelete",
            password: "clientDelete",
            email: "clientDelete@clientDelete",
            name: "clientDelete",
            surname: "clientDelete",
        })
        userClientId = tmpResClient.header.location.split("users/")[1]
        const payloadClient = {
            userId: userClientId,
            email: "clientDelete@clientDelete",
        }
        tokenClient = jwt.sign(payloadClient, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })

        const jsonstr = JSON.stringify({
            name: "parkingDelete",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        const jsonInsertion = JSON.stringify({
            name: "insertion name",
            datetimeStart: "2022-06-06T08:00:00.000+02:00",
            datetimeEnd: "2022-07-06T08:00:00.000+02:00",
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

        reservId = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", tokenClient)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+02:00",
                datetimeEnd: "2022-06-10T11:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v1\/reservations\/(.*)/)
        reservId = reservId.header.location.split("reservations/")[1]
    })

    afterAll(async () => {
        await cleanDB()
        await mongoose.connection.close()
        //await mongoServer.stop()


        /* const directory = './static/uploads';

        const fileNames = await fs.promises.readdir(directory)

        for (const file of fileNames) {
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });

            }
        } */
    })

    test("DELETE /api/v1/reservations/:reservationId without a valid token, should respond with 401", async () => {
        expect.assertions(0)
        const res = await request(app)
            .delete('/api/v1/reservations/' + reservId)
            .expect(401, { auth: false, message: 'Token missing or invalid' })

    })

    test("DELETE /api/v1/reservations/:reservationId with unauthorized user, should respond with 403", async () => {
        expect.assertions(0)
        const res = await request(app)
            .delete('/api/v1/reservations/' + reservId)
            .set("Authorization", token)
            .expect(403, { message: "User doesn't have the permission to delete this Reservation" })

    })

    test("DELETE /api/v1/reservations/:reservationId with non-existing reservation, should respond with 404", async () => {
        expect.assertions(0)
        const res = await request(app)
            .delete('/api/v1/reservations/1000')
            .set("Authorization", tokenClient)
            .expect(404, { message: "Reservation not found" })

    })

    test("DELETE /api/v1/reservations/:reservationId, should respond with 200", async () => {
        expect.assertions(0)
        const res = await request(app)
            .delete('/api/v1/reservations/' + reservId)
            .set("Authorization", tokenClient)
            .expect(200, { message: 'Reservation deleted' })

    })
})






describe("PUT /api/v1/reservations/:reservationId", () => {
    let userId
    let userId2
    let token
    let token2
    let reservId
    let parkId
    let parkId2
    let insertionId
    let insertionId2

    beforeAll(async () => {
        jest.setTimeout(5000);
        //mongoServer = await MongoMemoryServer.create()
        app.locals.db = await mongoose.connect(mongoServer.getUri())

        const tmpRes = await request(app).post('/api/v1/users').send({
            username: "test",
            password: "test",
            email: "test@test",
            name: "test",
            surname: "test",
        })
        userId = tmpRes.header.location.split("users/")[1]
        let payload = {
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
        payload = {
            userId: userId2,
            email: "test2@test2",
        }
        token2 = jwt.sign(payload, process.env.SUPER_SECRET, {
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
            datetimeStart: "2022-06-06T08:00:00.000+02:00",
            datetimeEnd: "2022-07-06T08:00:00.000+02:00",
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
            .expect(201)

        parkId = ((res.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId = ((res.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]

        reservId = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", token2)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+02:00",
                datetimeEnd: "2022-06-10T10:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v1\/reservations\/(.*)/)
            
        reservId = reservId.header.location.split("reservations/")[1]

        const res2 = await request(app)
            .get('/success?insertion=' + insertionId+ "&reservation=" + reservId)
            .set("Authorization", token2)
            .expect(201)

    })

    afterAll(async () => {
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
    })

    test("PUT /api/v1/reservations/:reservationId on non existent reservation, should respond with 404", async () => {
        expect.assertions(0);
        const res = await request(app)
            .put('/api/v1/reservations/100')
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+02:00",
                datetimeEnd: "2022-06-10T11:00:00.000+02:00",
            })
            .set("Authorization", token2)
            .expect(404, { message: "Reservation not found" })
    })

    test("PUT /api/v1/reservations/:reservationId of another user, should respond with 403", async () => {
        expect.assertions(0);

        const res = await request(app)
            .put(`/api/v1/reservations/${reservId}`)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+02:00",
                datetimeEnd: "2022-06-10T11:00:00.000+02:00",
            })
            .set("Authorization", token)
            .expect(403, { message: "You are not allowed to modify this reservation" })
    })

    test("PUT /api/v1/reservations/:reservationId with invalid request, should respond with 400", async () => {
        expect.assertions(0);
        const res = await request(app)
            .put(`/api/v1/reservations/${reservId}`)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+02:00",
                datetimeEnd: "2022-06-10T11:00:00.000+02:00",
                ciaoMamma: "oggi ho mangiato pasta col tonno",
            })
            .set("Authorization", token2)
            .expect(400, { message: "Some fields cannot be modified" })
    })

    test("PUT /api/v1/reservations/:reservationId with valid request, should respond with 200", async () => {
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        expect.assertions(0);
        const res = await request(app)
            .put(`/api/v1/reservations/${reservId}`)
            .set("Authorization", token2)
            .send({
                datetimeStart: "2022-06-10T09:00:00.000+02:00",
                datetimeEnd: "2022-06-10T11:00:00.000+02:00",
            })
            .expect(200)

        if (res.body && res.body.length === 1 && res.body[0]) {
            expect(res.body[0]).toMatchObject({
                self: "/api/v1/reservations/"+ reservId,
                datetimeStart: "2022-06-06T08:00:00.000+02:00",
                datetimeEnd: "2022-08-06T08:00:00.000+02:00",
                client: userId2,
                insertion: insertionId,
                parking: parkId,
                price: expect.any(Number),
                reviewed: false,
            })
        }
    })
})