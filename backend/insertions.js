import express from 'express'

import Insertion from './models/insertion.js'
import Parking from './models/parking.js'
import User from './models/user.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

import multer from 'multer'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "static/uploads")
    },
    filename: (rew, file, cb) => {
        console.log(file)
        cb(null, ""+  Date.now() + ".png")
    }
})
const upload = multer({storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            //return cb('Only .png, .jpg and .jpeg format allowed!');
        }
    }
})

const router = express.Router()

// Get all insertions
router.get('/', async (req, res) => {
    try {
        let insertions = await Insertion.find({}, {_id: 0, __v: 0}).populate(
            {
                path: "parking",
                model: "Parking",
                //match: { visible: { $eq: true } }
            }
        )
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

// Get an insertion of the parking
router.get('/:insertionId', async (req, res) => {
    try {
        let insertion = await Insertion.findById(req.params.insertionId, {_id: 0, __v: 0, parking: 0}).populate(
            {
                path: "reservations",
                model: "Reservation",
                select: {_id: 0, __v:0, insertion: 0},
                populate: [{
                    path: "client",
                    model: "User",
                    select: {self: 1}
                }]
            }
        )
        console.log(insertion)
        return res.status(200).json(insertion)
    } catch(err) {
        console.log(err)
        return res.status(404).send({ message: "Insertion not found" })
    }
})

router.post('/', [tokenChecker, upload.single("image")], async (req, res) => {
    try {
        if(!req.file) {
            return res.status(415).send({ message: 'Wrong file type for images' })
        }

        let bodyJSONInsertion = await JSON.parse(req.body["insertion"])
        let bodyJSONParking = await JSON.parse(req.body["parking"])
        
        bodyJSONParking.image = "uploads/"+ req.file["filename"]

        const validInsertionFields = ["name", "datetimeStart", "datetimeEnd", "priceHourly", "priceDaily", "minInterval"]
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
        let insertion = new Insertion(bodyJSONInsertion)

        console.log("USR ID POSY", req.loggedInUser.userId)
        let user = await User.findById(req.loggedInUser.userId)

        parking = await parking.save()
        insertion = await insertion.save()

        insertion.self = "/api/v1/insertions" + insertion.id
        insertion = await insertion.save()

        parking.insertions.push(insertion)

        parking = await parking.save()

        user.parkings.push(parking)

        await user.save()

        res.status(201).location({ parking: parking.self, insertion: insertion.self}).send()
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Bad request" })
    }
})

//TODO Modify a parking 
router.put('/:insertionId', tokenChecker, async (req, res) => {
    //TODO  
})

//TODO Delete a parking
router.delete('/:insertionId', tokenChecker, async (req, res) => {
    //TODO
})

export { router as insertions }