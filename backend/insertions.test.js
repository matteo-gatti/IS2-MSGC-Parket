import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import User from './models/user.js'
import Parking from './models/parking.js'
import Insertion from './models/insertion.js'
import { jest } from '@jest/globals'
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { Storage } from '@google-cloud/storage'
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

describe("POST /api/v1/insertions", () => {
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

    test("POST /api/v1/insertions with invalid request, should respond with 400", async () => {
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
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
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

    test("POST /api/v1/insertions with valid request, should respond with 201, and the locations of the parking and of the insertion", async () => {
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
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
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
        const parkings = await Parking.find({})
        const locInsertion = (res.header.location.split(",")[1]).split(":")[1]
        console.log("ins park", locInsertion, locParking)
        expect(locParking).toMatch(/\/api\/v1\/parkings\/(.*)/)
        expect(locInsertion).toMatch(/\/api\/v1\/insertions\/(.*)/)
    })
})


describe("DELETE /api/v1/insertions/:insertionId", () => {
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
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
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

        const jsonstr2 = JSON.stringify({
            name: "parking",
            address: "address",
            city: "city",
            country: "country",
            description: "description",
            image: "",
        })

        const jsonInsertion2 = JSON.stringify({
            name: "insertion name",
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
            priceHourly: 10,
            priceDaily: 100,
            minInterval: 60
        })

        const res2 = await request(app)
            .post('/api/v1/insertions')
            .set("Authorization", token2)
            .field("parking", jsonstr2)
            .field("insertion", jsonInsertion2)
            .attach("image", "./static/img/logo.png")
            .expect(201)

        parkId2 = ((res2.header.location.split(",")[0]).split(":")[1]).split("parkings/")[1]
        insertionId2 = ((res2.header.location.split(",")[1]).split(":")[1]).split("insertions/")[1]

        reservId = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", token2)
            .send({
                datetimeStart: "2100-06-10T09:00:00.000+02:00",
                datetimeEnd: "2100-06-10T10:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v1\/reservations\/(.*)/)

        reservId = reservId.header.location.split("reservations/")[1]

        await request(app)
            .get('/success?insertion=' + insertionId + "&reservation=" + reservId)
            .set("Authorization", token2)
            .expect(201)
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

    test("DELETE /api/v1/insertions/:insertionId on non existent insertion, should respond with 404", async () => {
        expect.assertions(0);
        const res = await request(app)
            .delete('/api/v1/insertions/100')
            .set("Authorization", token)
            .expect(404, { message: "Insertion not found" })
    })

    test("DELETE /api/v1/insertions/:insertionId of another user, should respond with 403", async () => {
        expect.assertions(0);

        const res = await request(app)
            .delete(`/api/v1/insertions/${insertionId2}`)
            .set("Authorization", token)
            .expect(403, { message: "User doesn't have the permission to delete this Insertion" })
    })

    test("DELETE /api/v1/insertions/:insertionId with invalid request (insertion is reserved), should respond with 400", async () => {
        expect.assertions(0);
        const res = await request(app)
            .delete(`/api/v1/insertions/${insertionId}`)
            .set("Authorization", token)
            .expect(400, { message: "Can't delete insertion with active reservations" })
    })

    test("DELETE /api/v1/insertions/:insertionId with valid request, should respond with 200", async () => {
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        expect.assertions(0);
        const res = await request(app)
            .delete(`/api/v1/insertions/${insertionId2}`)
            .set("Authorization", token2)
            .expect(200, { message: "Insertion deleted" })
    })
})


describe("PUT /api/v1/insertions/:insertionId", () => {
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
            datetimeStart: "2100-06-06T08:00:00.000+02:00",
            datetimeEnd: "2100-07-06T08:00:00.000+02:00",
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

        const inser = await Insertion.find({})

        reservId = await request(app)
            .post('/api/v1/insertions/' + insertionId + '/reservations')
            .set("Authorization", token2)
            .send({
                datetimeStart: "2100-06-10T09:00:00.000+02:00",
                datetimeEnd: "2100-06-10T10:00:00.000+02:00",
            })
            .expect(202).expect("location", /\/api\/v1\/reservations\/(.*)/)
            
        reservId = reservId.header.location.split("reservations/")[1]
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

    test("PUT /api/v1/insertions/:insertionId on non existent insertion, should respond with 404", async () => {
        expect.assertions(0);
        const res = await request(app)
            .put('/api/v1/insertions/100')
            .send({
                name: "insertionUpdated",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                minInterval: 10,
                priceHourly: 10,
                priceDaily: 10,
                recurrent: false,
            })
            .set("Authorization", token)
            .expect(404, { message: "Insertion not found" })
    })

    test("PUT /api/v1/insertions/:insertionId of another user, should respond with 403", async () => {
        expect.assertions(0);

        const res = await request(app)
            .put(`/api/v1/insertions/${insertionId}`)
            .send({
                name: "insertionUpdated",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                minInterval: 10,
                priceHourly: 10,
                priceDaily: 10,
                recurrent: false,
            })
            .set("Authorization", token2)
            .expect(403, { message: "You are not the owner of this parking" })
    })

    test("PUT /api/v1/insertions/:insertionId with invalid request, should respond with 400", async () => {
        expect.assertions(0);
        const res = await request(app)
            .put(`/api/v1/insertions/${insertionId}`)
            .send({
                name: "insertionUpdated",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-07-06T08:00:00.000+02:00",
                minInterval: 10,
                priceHourly: 10,
                priceDaily: 10,
                recurrent: false,
                ciaoMamma: "oggi ho mangiato pasta col tonno",
            })
            .set("Authorization", token)
            .expect(400, { message: "Some fields cannot be modified" })
    })

    test("PUT /api/v1/insertions/:insertionId with valid request, should respond with 200", async () => {
        // Preconditions: add a user and 3 parkings (visible with insertion, invisible with insertion and visible without insertion)
        expect.assertions(0);
        const res = await request(app)
            .put(`/api/v1/insertions/${insertionId}`)
            .set("Authorization", token)
            .send({
                name: "insertionUpdated",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-08-06T08:00:00.000+02:00",
                priceHourly: 100,
                priceDaily: 100,
                minInterval: 10,
                recurrent: false
            })
            .expect(200)

        if (res.body && res.body.length === 1 && res.body[0]) {
            expect(res.body[0]).toMatchObject({
                _id: insertionId,
                name: "insertionUpdated",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-08-06T08:00:00.000+02:00",
                priceHourly: 100,
                priceDaily: 100,
                minInterval: 10,
                recurrent: false
            })
        }
    })

    test("PUT /api/v1/insertions/:insertionId with lower fees, should respond with 200 and edit the reservation list", async () => {
        expect.assertions(1);
        const res = await request(app)
            .put(`/api/v1/insertions/${insertionId}`)
            .set("Authorization", token)
            .send({
                name: "insertionUpdated",
                datetimeStart: "2100-06-06T08:00:00.000+02:00",
                datetimeEnd: "2100-08-06T08:00:00.000+02:00",
                priceHourly: 1,
                priceDaily: 1,
                minInterval: 10,
                recurrent: false
            })
            .expect(200)

        const resReservation = await request(app)
            .get(`/api/v1/reservations/${reservId}`)
            .set("Authorization", token2)
            .expect(200)

        if (resReservation.body) {
            expect(resReservation.body).toMatchObject({
                datetimeStart: expect.any(String),
                datetimeEnd: expect.any(String),
                price: 1,
                client: {
                    _id: userId2
                }
            })
        }
    })
})