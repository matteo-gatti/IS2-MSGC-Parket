import express from 'express'
import multer from 'multer'
import moment from 'moment'
import fs from 'fs'
import path from 'path'

import Insertion from './models/insertion.js'
import Parking from './models/parking.js'
import User from './models/user.js'
import Reservation from './models/reservation.js'
import tokenChecker from './tokenChecker.js'
import GCloud from './gcloud/gcloud.js'

// Storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "static/uploads")
    },
    filename: (rew, file, cb) => {
        cb(null, "" + Date.now() + ".png")
    }
})

// Needed to receive uploaded images from the users
const upload = multer({
    storage: storage,
    // Filter only images files
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
})


const router = express.Router()

// Create an insertion embedding a new parking
router.post('/', [tokenChecker, upload.single("image")], async (req, res) => {
    try {
        // If no image file provided
        if (!req.file) {
            return res.status(415).send({ message: 'Wrong file type for images' })
        }

        // Separate and parse the two different parts dedicated to the insertion and the other one to the parking
        let bodyJSONInsertion = await JSON.parse(req.body["insertion"])
        let bodyJSONParking = await JSON.parse(req.body["parking"])

        bodyJSONParking.image = "uploads/" + req.file["filename"]

        // check that correct data fields are sent (w.r.t. the DB model)
        const validInsertionFields = ["name", "datetimeStart", "datetimeEnd", "priceHourly", "priceDaily", "minInterval", "recurrent", "recurrenceData"]
        const validParkingFields = ["name", "address", "city", "country", "description", "image", "latitude", "longitude", "visible"]
        for (const field in bodyJSONInsertion) {
            if (!validInsertionFields.includes(field)) {
                fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
                    if (err) console.log(err)
                });
                return res.status(400).send({ message: "Some fields are invalid" })
            }
        }
        for (const field in bodyJSONParking) {
            if (!validParkingFields.includes(field)) {
                fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
                    if (err) console.log(err)
                });
                return res.status(400).send({ message: "Some fields are invalid" })
            }
        }

        let parking = new Parking(bodyJSONParking)

        let insertion = new Insertion()
        insertion.name = bodyJSONInsertion.name
        insertion.parking = parking
        insertion.datetimeStart = bodyJSONInsertion.datetimeStart
        insertion.datetimeEnd = bodyJSONInsertion.datetimeEnd
        insertion.priceHourly = bodyJSONInsertion.priceHourly
        if (bodyJSONInsertion.minInterval != null) insertion.minInterval = bodyJSONInsertion.minInterval
        if (bodyJSONInsertion.priceDaily != null) insertion.priceDaily = bodyJSONInsertion.priceDaily

        // check if the user wants a recurring insertion
        if (bodyJSONInsertion.recurrent === true) {
            insertion.recurrent = true
            insertion.recurrenceData = bodyJSONInsertion.recurrenceData
        }

        // Get the user and set the FKs of the parking and the insertion
        let user = await User.findById(req.loggedInUser.userId)
        parking.owner = user
        parking = await parking.save()
        try {
            insertion = await insertion.save()
        } catch (err) {
            await parking.remove()
            fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
                if (err) console.log(err)
            });
            return res.status(400).json({ message: "Bad request" })
        }

        // Set the correct self field and save it
        parking.self = "/api/v2/parkings/" + parking.id
        insertion.self = "/api/v2/insertions/" + insertion.id

        await GCloud.uploadFile("./static/uploads/" + req.file["filename"], req.file["filename"])
        parking.image = `https://storage.googleapis.com/parket-pictures/${req.file["filename"]}`

        fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
            if (err) throw err;
        });
        insertion = await insertion.save()
        parking = await parking.save()

        // Insert the insertion in the parking and save
        parking.insertions.push(insertion)
        parking = await parking.save()

        // Insert the parking in the user and save
        user.parkings.push(parking)
        await user.save()

        res.status(201).location(`parking:${parking.self},insertion:${insertion.self}`).send()
    } catch (err) {
        console.log(err)
        fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
            if (err) console.log(err)
        });
        res.status(400).json({ message: "Bad request" })
    }
})

// Get all insertions
router.get('/', async (req, res) => {
    try {
        let insertions = await Insertion.find({}, { _id: 0, __v: 0 }).populate(
            {
                path: "parking",
                model: "Parking",
            }
        )

        // Get all insertions of visible parkings
        let newInsertions = []
        for (let i = 0; i < insertions.length; i++) {
            if (insertions[i].parking.visible === true) {
                newInsertions.push(insertions[i])
            }
        }

        return res.status(200).json(newInsertions)
    } catch (err) {
        console.log(err)
        return res.status(500).send({ message: "Server error" })
    }
})

// Get an insertion
router.get('/:insertionId', async (req, res) => {
    try {
        let insertion = await Insertion.findById(req.params.insertionId, { _id: 0, __v: 0 }).populate(
            [{
                path: "reservations",
                model: "Reservation",
                select: { _id: 0, __v: 0, insertion: 0 },
                populate: [{
                    path: "client",
                    model: "User",
                    select: { self: 1, username: 1 }
                }]
            },
            {
                path: "parking",
                model: "Parking",
                select: { __v: 0, insertions: 0, owner: 0 },
            }]
        )
        return res.status(200).json(insertion)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Insertion not found" })
    }
})

// Modify an insertion 
router.put('/:insertionId', tokenChecker, async (req, res) => {
    // check that correct data fields are sent
    const validInsertionFields = ["name", "priceHourly", "priceDaily", "minInterval", "datetimeStart", "datetimeEnd", "recurrent", "recurrenceData"]
    for (const field in req.body) {
        if (!validInsertionFields.includes(field)) {
            return res.status(400).send({ message: "Some fields cannot be modified" })
        }
    }

    if (!req.body.name || !req.body.priceHourly || !req.body.priceDaily || !req.body.minInterval || !req.body.datetimeStart || !req.body.datetimeEnd) {
        return res.status(400).send({ message: "Some fields are empty or undefined" })
    }



    // if datetimeStart is after datetimeEnd, return error
    if (new Date(req.body.datetimeStart) > new Date(req.body.datetimeEnd)) {
        return res.status(400).send({ message: "Datetime start cannot be after datetime end" })
    }

    // if recurrent
    if (req.body.recurrent) {
        // check that the time interval is correct
        if (new Date(req.body.recurrenceData.timeStart) > new Date(req.body.recurrenceData.timeEnd)) {
            return res.status(400).send({ message: "Time slot not valid, time start is greater than time end" })
        }
    }

    req.body.datetimeStart = new Date(req.body.datetimeStart)
    req.body.datetimeEnd = new Date(req.body.datetimeEnd)

    try {
        // let the user modify the datetime start and end, if there is no reservation for that days
        let insertion = await Insertion.findById(req.params.insertionId).populate("parking")
        // if the user is not the owner of the parking, return 403
        var owner = String(insertion.parking.owner)
        if (owner !== req.loggedInUser.userId) {
            return res.status(403).send({ message: "You are not the owner of this parking" })
        }
        // check that the new insertion is not in the past
        if ((new Date(insertion.datetimeStart)).toString() !== req.body.datetimeStart.toString() && req.body.datetimeStart < new Date()) {
            return res.status(400).send({ message: "The new insertion is in the past" })
        }

        // prevent from modifying the insertion from non recurrent to recurrent
        if (insertion.recurrent === false && req.body.recurrent) {
            return res.status(400).send({ message: "Non recurrent insertion cannot be changed in recurrent" })
        }
        // prevent from modifying the insertion from recurrent to non recurrent
        if (insertion.recurrent === true && !req.body.recurrent) {
            return res.status(400).send({ message: "Recurrent insertion cannot be changed in non recurrent" })
        }

        let reservations = await Reservation.find({ insertion: insertion.id })

        if (reservations.length !== 0) {
            // get the earliest and latest datetime of the reservations
            let earliestReservation = new Date(reservations[0].datetimeStart)
            let latestReservation = new Date(reservations[0].datetimeEnd)
            for (let i = 1; i < reservations.length; i++) {
                if (earliestReservation > new Date(reservations[i].datetimeStart)) earliestReservation = new Date(reservations[i].datetimeStart)
                if (latestReservation < new Date(reservations[i].datetimeEnd)) latestReservation = new Date(reservations[i].datetimeEnd)
            }

            // check no reservations are left away
            if (req.body.datetimeStart != null) {
                let startDate = new Date(req.body.datetimeStart)
                if (startDate > earliestReservation) {
                    return res.status(400).send({ message: "The datetime start of the insertion cannot be after the datetime start of the reservations" })
                }
            }
            if (req.body.datetimeEnd != null) {
                let endDate = new Date(req.body.datetimeEnd)
                if (endDate < latestReservation) {
                    return res.status(400).send({ message: "The datetime end of the insertion cannot be before the datetime end of the reservations" })
                }
            }

            // ---------------------------------- advantageous price for the user ----------------------------------
            // if the priceHourly or priceDaily is lower than before, we need to update the reservations' price
            // retrieve all reservations of the insertion
            // for each reservation, update the price
            if (req.body.priceHourly < insertion.priceHourly || req.body.priceDaily < insertion.priceDaily) {
                //for each reservation of reservations
                for (let i = 0; i < reservations.length; i++) {
                    var oldPrice = reservations[i].price

                    reservations[i].price = 0
                    let minutesDiff = moment(reservations[i].datetimeEnd).diff(moment(reservations[i].datetimeStart), "minutes")

                    if (req.body.priceDaily) {
                        const dayDiff = moment(reservations[i].datetimeEnd).diff(moment(reservations[i].datetimeStart), "days")
                        minutesDiff -= dayDiff * 24 * 60
                        reservations[i].price += dayDiff * req.body.priceDaily
                    }
                    reservations[i].price += minutesDiff / 60 * req.body.priceHourly

                    // update the price of the reservation if it is convenient
                    if (reservations[i].price < oldPrice) {
                        await Reservation.findByIdAndUpdate(reservations[i].id, { price: reservations[i].price })
                    }
                }
            }
        }

        // if the insertion is recurrent, modifications do not regard the reservations already done
        // therefore modifications only apply to the future reservations

        // finally update the insertion
        insertion = await Insertion.findByIdAndUpdate(req.params.insertionId, req.body)

        return res.status(200).json(insertion)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Insertion not found" })
    }
})

// Delete an insertion
router.delete('/:insertionId', tokenChecker, async (req, res) => {
    try {
        let insertion = await Insertion.findById(req.params.insertionId, { _id: 0, __v: 0 }).populate(
            [{
                path: "reservations",
                model: "Reservation",
                select: { _id: 0, __v: 0, insertion: 0 },
                populate: [{
                    path: "client",
                    model: "User",
                    select: { self: 1, username: 1 }
                }]
            },
            {
                path: "parking",
                model: "Parking",
                select: { __v: 0, insertions: 0 },
            }]
        )
        var owner = String(insertion.parking.owner)
        if (owner !== req.loggedInUser.userId) {
            return res.status(403).send({ message: "User doesn't have the permission to delete this Insertion" })
        }
        if (insertion.reservations.length != 0) {
            return res.status(400).send({ message: "Can't delete insertion with active reservations" })
        }

        // Delete insertion from parking
        await Parking.findByIdAndUpdate(insertion.parking.id, {
            $pull: {
                insertions: req.params.insertionId
            }
        })

        await Insertion.findOneAndDelete({ _id: req.params.insertionId })
        return res.status(200).send({ message: "Insertion deleted" })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Insertion not found" })
    }
})


export { router as insertions }