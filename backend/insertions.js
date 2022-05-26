import express from 'express'
import multer from 'multer'

import Insertion from './models/insertion.js'
import Parking from './models/parking.js'
import User from './models/user.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

// Storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "static/uploads")
    },
    filename: (rew, file, cb) => {
        cb(null, ""+  Date.now() + ".png")
    }
})

// Needed to receive uploaded images from the users
const upload = multer({storage: storage,
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
        if(!req.file) {
            return res.status(415).send({ message: 'Wrong file type for images' })
        }

        // Separate and parse the two different parts dedicated to the insertion and the other one to the parking
        let bodyJSONInsertion = await JSON.parse(req.body["insertion"])
        let bodyJSONParking = await JSON.parse(req.body["parking"])
        
        bodyJSONParking.image = "uploads/"+ req.file["filename"]

        // check that correct data fields are sent (w.r.t. the DB model)
        const validInsertionFields = ["name", "datetimeStart", "datetimeEnd", "priceHourly", "priceDaily", "minInterval", "recurrent", "recurrenceData"]
        const validParkingFields = ["name", "address", "city", "country", "description", "image", "latitude", "longitude", "visible"]
        for (const field in bodyJSONInsertion) {
            if (!validInsertionFields.includes(field)) {
                return res.status(400).send({ message: "Some fields are invalid" })
            }
        }
        for (const field in bodyJSONParking) {
            if (!validParkingFields.includes(field)) {
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
        insertion = await insertion.save()

        // Set the correct self field and save it
        insertion.self = "/api/v1/insertions/" + insertion.id
        insertion = await insertion.save()

        // Insert the insertion in the parking and save
        parking.insertions.push(insertion)
        parking = await parking.save()

        // Insert the parking in the user and save
        user.parkings.push(parking)
        await user.save()

        res.status(201).location({ parking: parking.self, insertion: insertion.self}).send()
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Bad request" })
    }
})

// Get all insertions
router.get('/', async (req, res) => {
    try {
        let insertions = await Insertion.find({}, {_id: 0, __v: 0}).populate(
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
    } catch(err) {
        console.log(err)
        return res.status(500).send({ message: "Server error" })
    }
})

// Get an insertion
router.get('/:insertionId', async (req, res) => {
    try {
        let insertion = await Insertion.findById(req.params.insertionId, {_id: 0, __v: 0}).populate(
            [{
                path: "reservations",
                model: "Reservation",
                select: {_id: 0, __v:0, insertion: 0},
                populate: [{
                    path: "client",
                    model: "User",
                    select: {self: 1, username: 1}
                }]
            },
            {
                path: "parking",
                model: "Parking",
                select: {_id: 0, __v:0, insertions: 0, owner: 0},
            }]
        )
        return res.status(200).json(insertion)
    } catch(err) {
        console.log(err)
        return res.status(404).send({ message: "Insertion not found" })
    }
})

// TODO: Modify an insertion 
router.put('/:insertionId', tokenChecker, async (req, res) => {
    // TODO  
})

//Delete an insertion
router.delete('/:insertionId', tokenChecker, async (req, res) => {
    try {
        let test = await Insertion.findById(req.params.insertionId, { _id: 0, __v: 0 }).populate(
            [{
                path: "reservations",
                model: "Reservation",
                select: {_id: 0, __v:0, insertion: 0},
                populate: [{
                    path: "client",
                    model: "User",
                    select: {self: 1, username: 1}
                }]
            },
            {
                path: "parking",
                model: "Parking",
                select: { __v:0, insertions: 0},
            }]
        )
        var owner = String(test.parking.owner)
        if(owner !== req.loggedInUser.userId) {
            return res.status(403).send({message: "User doesn't have the permission to delete this Insertion"})
        }
        if(test.reservations.length != 0)
        {
            return res.status(405).send({message: "Can't delete insertion with active reservations"})
        }
        
       //cancello inserzione dalla lista nell'oggetto parcheggio
        let maerda = await Parking.findById(test.parking.id)
        console.log(maerda)
        let park = await Parking.findByIdAndUpdate(test.parking.id,{
            $pull:{
                insertions: req.params.insertionId
            }
        })

        await Insertion.findOneAndDelete({_id: req.params.insertionId})
        return res.status(200).send({message: "Insertion deleted"})
    } catch(err) {
        console.log(err)
        return res.status(404).send({message: "Insertion not found" })
    }
})


export { router as insertions }