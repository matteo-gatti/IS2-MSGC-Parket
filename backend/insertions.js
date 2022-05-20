import express from 'express'

import Insertion from './models/insertion.js'
import Reservation from './models/reservation.js'
import Parking from './models/parking.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

const router = express.Router()

// Create a new insertion
router.post('/:parkId/insertions', tokenChecker, async (req, res) => {
    try {
        let parking = await Parking.findById(req.params.parkId).populate("owner")

        // check if the user is the owner of the parking
        if(req.loggedInUser.userId !== parking.owner.id) {
            return res.status(403).send({ message: "User is not authorized to perform this action" })
        }

        // create the insertion
        let insertion = new Insertion()
        insertion.name = req.body.name
        insertion.parking = parking
        insertion.datetimeStart = req.body.datetimeStart
        insertion.datetimeEnd = req.body.datetimeEnd
        insertion.priceHourly = req.body.priceHourly
        if(req.body.priceDaily) insertion.priceDaily = req.body.priceDaily
        
        insertion = await insertion.save()

        insertion.self = "/api/v1/parkings/" + req.params.parkId + "/insertions/" + insertion.id
        insertion = await insertion.save()

        parking.insertions.push(insertion)
        await parking.save()

        // link to the newly created resource is returned in the location header
        res.location('/api/v1/parkings/' + req.params.parkId + "/insertions/" + insertion.id ).status(201).send()
    } catch(err) {
        console.log(err)
        if (err.name === "ValidationError") {
            return res.status(400).send({ message: "Some fields are empty or undefined" })
        }
        return res.status(404).send({ message: "Parking or owner not found" })
    }
})

// Get an insertion of the parking
router.get('/:parkId/insertions/:insertionId', async (req, res) => {
    try {
        let insertion = await Insertion.findById(req.params.insertionId, {_id: 0, __v: 0, parking: 0}).populate("reservations", {_id: 0, __v:0, insertion: 0}).populate("reservations.client")
        console.log(insertion)
        return res.status(200).json(insertion)
    } catch(err) {
        console.log(err)
        return res.status(400).send({ message: "Some fields are empty or undefined" })
    }
})

// Get all the insertions of a parking
router.get('/:parkId/insertions', async (req, res) => {
    try {
        let insertion = await Parking.findById(req.params.parkId, {insertions: 1}).populate("insertions").populate("insertions.reservations", {_id: 0, __v:0, insertion: 0}).populate("insertions.reservations.client")

        console.log(insertion)
        return res.status(200).json(insertion)
    } catch(err) {
        console.log(err)
        return res.status(400).send({ message: "Some fields are empty or undefined" })
    }
})

//TODO Modify a parking 
router.put('/:parkId/insertions/:insertionId', tokenChecker, async (req, res) => {
    //TODO  
})

//TODO Delete a parking
router.delete('/:parkId/insertions/:insertionId', tokenChecker, async (req, res) => {
    //TODO
})

export { router as insertions }