import express from 'express'
import multer from 'multer'
import mongoose_fuzzy_searching from "@imranbarbhuiya/mongoose-fuzzy-searching"

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
    if(!req.file) {
        return res.status(415).send({ message: 'Wrong file type for images' })
    }
    let bodyJSON = await JSON.parse(req.body["json"])
    bodyJSON.image = "uploads/"+ req.file["filename"]

    let parking = new Parking(bodyJSON)
    
    try {
        let user = await User.findById(req.loggedInUser.userId)

        // set the owner of the parking to the logged in user
        parking.owner = user
        let newParking = await parking.save()

        let parkingId = newParking._id
        newParking.self = "/api/v1/parkings/" + parkingId
        newParking = await newParking.save()

        // add reference into the user object
        user.parkings.push(newParking)
        await user.save()

        // link to the newly created resource is returned in the location header
        res.location('/api/v1/parkings/' + parkingId).status(201).send()
    } catch (err) {
        console.log(err)
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
        if(Object.keys(req.query).length >= 0) {
            const validParams = ["search", "priceMin", "priceMax", "dateMin", "dateMax"]
            const queryDict = {}
            for (let field in req.query) {
                if(validParams.includes(field)) {
                    queryDict[field] = req.query[field]
                } else {
                    return res.status(400).send({ message: 'Invalid query parameter' })
                }
            }
            if("search" in queryDict) {
                fuzzySearchQuery = queryDict["search"]
            }
            if("priceMin" in queryDict) {
                insertionMatch.priceHourly = {}
                insertionMatch.priceHourly.$gte = queryDict["priceMin"]
            } 
            if("priceMax" in queryDict) {
                if(insertionMatch.priceHourly == null) {
                    insertionMatch.priceHourly = {}
                }
                insertionMatch.priceHourly.$lte = queryDict["priceMax"] 
            } 
            if("dateMin" in queryDict) {
                console.log(queryDict["dateMin"])
                insertionMatch.datetimeStart = {}
                insertionMatch.datetimeEnd = {}
                insertionMatch.datetimeStart.$lte = new Date(queryDict["dateMin"])
                insertionMatch.datetimeEnd.$gte = new Date(queryDict["dateMin"])
            }
            if("dateMax" in queryDict) {
                console.log(queryDict["dateMax"])
                if (insertionMatch.datetimeStart == null) {
                    insertionMatch.datetimeStart = {}
                }
                if (insertionMatch.datetimeEnd == null) {
                    insertionMatch.datetimeEnd = {}
                }
                if(insertionMatch.datetimeStart.$lte != null && insertionMatch.datetimeStart.$lte > new Date(queryDict["dateMax"])) {
                    insertionMatch.datetimeStart.$lte = new Date(queryDict["dateMax"])
                }
                if(insertionMatch.datetimeEnd.$gte != null && insertionMatch.datetimeEnd.$gte < new Date(queryDict["dateMax"])) {
                    insertionMatch.datetimeEnd.$gte = new Date(queryDict["dateMax"])
                }
                insertionMatch.datetimeEnd.$gte = new Date(queryDict["dateMax"])
            }
        }
        
        let parkings = []
        if(fuzzySearchQuery !== "") {
            parkings = await Parking.fuzzySearch(fuzzySearchQuery).select({__v: 0, confidenceScore: 0 }).populate(
                {
                    path: "insertions",
                    model: "Insertion",
                    select: {_id: 0, __v:0,},
                    match: insertionMatch
                })
        } else {   
            parkings = await Parking.find(query, { __v: 0 }).populate(
                {
                    path: "insertions",
                    model: "Insertion",
                    select: {_id: 0, __v:0,},
                    match: insertionMatch
                })
        }
        parkings = parkings.filter(parking => parking.visible === true && parking.insertions.length > 0)
        // remove property visible from the parkings
        for (let parking of parkings) {
            parking.visible = undefined
        }
        return res.status(200).json(parkings)
    } catch (err) {
        console.log(err)
        return res.status(500).send({ message: 'Unexpected error' })
    }
})

// Modify a parking
router.put('/:parkingId', [tokenChecker, upload.single("image")], async (req, res) => {
    let bodyJSON
    if(req.body["json"] !== undefined) {
        bodyJSON = await JSON.parse(req.body["json"])
        if(!req.file) {
            // if no image is uploaded, the old one is kept
            const oldParking = await Parking.findById(req.params.parkingId)
            bodyJSON.image = oldParking.image
            //return res.status(415).send({ message: 'Wrong file type for images' })
        } else {
            bodyJSON.image = "uploads/"+ req.file["filename"]
        }

        const validFields = ["name", "address", "city", "country", "description", "image", "latitude", "longitude", "visible"]
        for (const field in bodyJSON) {
            if (!validFields.includes(field)) {
                return res.status(400).send({ message: "Some fields cannot be modified or do not exist" })
            }
        }

        if(!bodyJSON.name || !bodyJSON.address || !bodyJSON.city || !bodyJSON.country || !bodyJSON.description) {
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

        const updatedParking = await Parking.findByIdAndUpdate(req.params.parkingId, bodyJSON, { runValidators: true , new: true })
        
        return res.status(200).json(updatedParking)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

// Delete a parking
router.delete('/:parkingId', tokenChecker, async (req, res) => {
    try {
        const parking = await Parking.findById(req.params.parkingId)
        let parkingOwner = String(parking.owner)
        // if user is not the owner of the parking, return error
        if (parkingOwner !== req.loggedInUser.userId) {
            return res.status(403).send({ message: 'User is not authorized to do this action' })
        }if(parking.insertions.length != 0)
        {
            return res.status(405).send({ message: 'Cannot delete parking with active insertions' })
        }

        await parking.remove()
        return res.status(200).send({ message: 'Parking deleted' })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})


export { router as parkings }