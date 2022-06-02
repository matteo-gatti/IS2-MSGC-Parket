import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

import Insertion from './models/insertion.js'
import Parking from './models/parking.js'
import User from './models/user.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'
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
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
})

const router = express.Router()

// Create a new parking, pass through token and upload middlewares
router.post('', [tokenChecker, upload.single("image")], async (req, res) => {
    if (!req.file) {
        return res.status(415).send({ message: 'Wrong file type for images' })
    }

    let bodyJSON = await JSON.parse(req.body["json"])
    bodyJSON.image = "uploads/" + req.file["filename"]

    let parking = new Parking(bodyJSON)

    try {
        let user = await User.findById(req.loggedInUser.userId)

        // set the owner of the parking to the logged in user
        parking.owner = user
        let newParking = await parking.save()

        let parkingId = newParking._id
        newParking.self = "/api/v2/parkings/" + parkingId

        await GCloud.uploadFile("./static/uploads/" + req.file["filename"], req.file["filename"])
        newParking.image = `https://storage.googleapis.com/parket-pictures/${req.file["filename"]}`
        newParking = await newParking.save()

        fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
            if (err) throw err;
        });

        // add reference into the user object
        user.parkings.push(newParking)
        await user.save()

        // link to the newly created resource is returned in the location header
        res.location('/api/v2/parkings/' + parkingId).status(201).send()
    } catch (err) {
        console.log(err)
        fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
            if (err) console.log(err)
        });
        return res.status(400).send({ message: "Some fields are empty or undefined" })
    }
})

// Get all parkings of the requester
router.get('/myParkings', tokenValid, async (req, res) => {
    if (!isAuthToken(req)) {
        res.status(401).send({ message: 'Token missing or invalid' })
    } else {
        try {
            const idUser = req.loggedInUser.userId

            const parkings = await Parking.find({ owner: idUser })

            return res.status(200).json(parkings)
        } catch (err) {
            console.log(err)
            return res.status(404).send({ message: 'User not found' })
        }
    }
})

// Get a parking
router.get('/:parkingId', async (req, res) => {
    try {
        const parking = await Parking.findById(req.params.parkingId, { __v: 0 })
        return res.status(200).json(parking)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

// Get all parkings
router.get('', async (req, res) => {
    try {
        const query = { $and: [{ visible: true }, { insertions: { $exists: true, $ne: [] } }] }
        const insertionMatch = {}
        const testQuery = { $and: [{ visible: true }, { insertions: { $exists: true, $ne: [] } }] }
        let fuzzySearchQuery = ""
        //If parameters are in the query we need to filter the results
        if (Object.keys(req.query).length >= 0) {
            const validParams = ["search", "priceMin", "priceMax", "dateMin", "dateMax"]
            const queryDict = {}
            for (let field in req.query) {
                if (validParams.includes(field)) {
                    queryDict[field] = req.query[field]
                } else {
                    return res.status(400).send({ message: 'Invalid query parameter' })
                }
            }
            if ("search" in queryDict) {
                fuzzySearchQuery = queryDict["search"]
            }
            // If the user wants to filter by price
            if ("priceMin" in queryDict) {
                insertionMatch.priceHourly = {}
                insertionMatch.priceHourly.$gte = queryDict["priceMin"]
            }
            // If the user wants to filter by price
            if ("priceMax" in queryDict) {
                if (insertionMatch.priceHourly == null) {
                    insertionMatch.priceHourly = {}
                }
                insertionMatch.priceHourly.$lte = queryDict["priceMax"]
            }
            // If dateMin is defined, we need to filter the results by the date
            if ("dateMin" in queryDict) {
                insertionMatch.datetimeStart = {}
                insertionMatch.datetimeEnd = {}
                insertionMatch.datetimeStart.$lte = new Date(queryDict["dateMin"])
                insertionMatch.datetimeEnd.$gte = new Date(queryDict["dateMin"])
            }
            // If the dateMax is defined, we need to filter the results by the date
            if ("dateMax" in queryDict) {
                if (insertionMatch.datetimeStart == null) {
                    insertionMatch.datetimeStart = {}
                }
                if (insertionMatch.datetimeEnd == null) {
                    insertionMatch.datetimeEnd = {}
                }
                if (insertionMatch.datetimeStart.$lte != null && insertionMatch.datetimeStart.$lte > new Date(queryDict["dateMax"])) {
                    insertionMatch.datetimeStart.$lte = new Date(queryDict["dateMax"])
                }
                if (insertionMatch.datetimeEnd.$gte != null && insertionMatch.datetimeEnd.$gte < new Date(queryDict["dateMax"])) {
                    insertionMatch.datetimeEnd.$gte = new Date(queryDict["dateMax"])
                }
                insertionMatch.datetimeEnd.$gte = new Date(queryDict["dateMax"])
            }
        }

        let parkings = []
        if (fuzzySearchQuery !== "") {
            // Fuzzy search
            parkings = await Parking.fuzzySearch(fuzzySearchQuery).select({ __v: 0, confidenceScore: 0 }).populate(
                [{
                    path: "insertions",
                    model: "Insertion",
                    select: { _id: 0, __v: 0, },
                    match: insertionMatch
                },
                {
                    path: "reviews",
                    model: "Review",
                    select: { stars: 1 }
                }
                ])
        } else {
            parkings = await Parking.find(query, { __v: 0 }).populate(
                [{
                    path: "insertions",
                    model: "Insertion",
                    select: { _id: 0, __v: 0, },
                    match: insertionMatch
                },
                {
                    path: "reviews",
                    model: "Review",
                    select: { stars: 1 }
                }])
        }
        // remove parkings which have no insertions (or that have no insertions found after the filter)
        parkings = parkings.filter(parking => parking.visible === true && parking.insertions.length > 0)
        // remove property visible from the parkings
        for (let parking of parkings) {
            parking.visible = undefined
        }
        //calculate average stars for each parking
        let parkingObjects = []
        for (let parking of parkings) {
            let sum = 0
            for (let review of parking.reviews) {
                sum += review.stars
            }
            let avg = sum / parking.reviews.length
            avg = Math.round(avg * 10) / 10
            parkingObjects.push(Object.assign(parking.toObject(), { averageStars: avg }))
        }
        return res.status(200).json(parkingObjects)
    } catch (err) {
        console.log(err)
        return res.status(500).send({ message: 'Unexpected error' })
    }
})

// Modify a parking
router.put('/:parkingId', [tokenChecker, upload.single("image")], async (req, res) => {
    let bodyJSON
    let newImage = null
    if (req.body["json"] !== undefined) {
        bodyJSON = await JSON.parse(req.body["json"])
        const oldParking = await Parking.findById(req.params.parkingId)
        if (!req.file) {
            // if no image is uploaded, the old one is kept
            bodyJSON.image = oldParking.image
            //return res.status(415).send({ message: 'Wrong file type for images' })
        } else {
            await GCloud.uploadFile("./static/uploads/" + req.file["filename"], req.file["filename"])
            bodyJSON.image = `https://storage.googleapis.com/parket-pictures/${req.file["filename"]}`
            const oldImage = oldParking.image.split("/")[oldParking.image.split("/").length - 1]
            await GCloud.deleteFile(oldImage)
            fs.unlink(path.join("static/uploads", req.file["filename"]), err => {
                if (err) throw err;
            });
        }

        const validFields = ["name", "address", "city", "country", "description", "image", "latitude", "longitude", "visible"]
        for (const field in bodyJSON) {
            if (!validFields.includes(field)) {
                return res.status(400).send({ message: "Some fields cannot be modified or do not exist" })
            }
        }

        if (!bodyJSON.name || !bodyJSON.address || !bodyJSON.city || !bodyJSON.country || !bodyJSON.description) {
            return res.status(400).send({ message: "Some fields are empty or undefined" })
        }
    } else {
        bodyJSON = req.body
    }

    try {
        const parking = await Parking.findById(req.params.parkingId)

        let parkingOwner = String(parking.owner)
        // if user is not the owner of the parking, return error
        if (parkingOwner.substring(parkingOwner.lastIndexOf('/') + 1) !== req.loggedInUser.userId) {
            return res.status(403).send({ message: 'User is not authorized to do this action' })
        }

        const updatedParking = await Parking.findByIdAndUpdate(req.params.parkingId, bodyJSON, { runValidators: true, new: true })

        return res.status(200).json(updatedParking)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

router.delete('/:parkingId', tokenChecker, async (req, res) => {
    try {
        const parking = await Parking.findById(req.params.parkingId).populate([{
            path: "insertions",
            model: "Insertion",
            select: { id: 1, reservations: 1 }
        }])
        let parkingOwner = String(parking.owner)
        // if user is not the owner of the parking, return error
        if (parkingOwner !== req.loggedInUser.userId) {
            return res.status(403).send({ message: 'User is not authorized to do this action' })
        }
        if (parking.insertions.length != 0) {
            for (const insertion of parking.insertions) {
                if (insertion.reservations.length !== 0) {
                    return res.status(400).send({ message: 'Cannot delete parking with active insertions' })
                } else {
                    await Insertion.findByIdAndDelete(insertion.id)
                }
            }
        }

        const oldImage = parking.image.split("/")[parking.image.split("/").length - 1]
        await GCloud.deleteFile(oldImage)

        await parking.remove()
        return res.status(200).send({ message: 'Parking deleted' })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

export { router as parkings }