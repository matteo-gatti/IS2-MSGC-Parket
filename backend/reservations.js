import express from 'express'

import Insertion from './models/insertion.js'
import Reservation from './models/reservation.js'
import User from './models/user.js'

import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

const router = express.Router()

// Create a new reservation
router.post('/:insertionId/reservations', tokenChecker, async (req, res) => {
    try {
        let insertion = await Insertion.findById(req.params.insertionId).populate("reservations").populate("parkings")
        //let insertion = await Insertion.findById(req.params.insertionId).populate("reservations", "parking")

        // check if the user is not the owner of the parking
        let user = await User.findById(req.loggedInUser.userId)
        if(user.id !== insertion.parking.owner.id) {
            return res.status(403).send({ message: "User is not authorized to perform this action" })
        }
        
        for(const resv in insertion.reservations) {
            if(req.body.datetimeStart >= resv.datetimeStart && req.body.datetimeStart <= resv.datetimeEnd) {
                return res.status(400).send({ message: "Timeslot is not available"})
            }
            if(req.body.datetimeEnd >= resv.datetimeStart && req.body.datetimeEnd <= resv.datetimeEnd) {
                return res.status(400).send({ message: "Timeslot is not available"})
            }
        }

        // create the reservation
        let reservation = new Reservation(req.body)
        reservation.client = User.findById(req.loggedInUser.id)
        reservation.insertion = insertion
        reservation.datetimeStart = req.body.datetimeStart
        reservation.datetimeEnd = req.body.datetimeEnd

        reservation.price = (new Date(reservation.datetimeEnd) - new Date(reservation.datetimeStart)).getHours() * insertion.priceHourly

        reservation = await reservation.save()
        reservation.self = `/api/v1/parking${insertion.parking.id}/inserions/${insertion.id}/reservations/${reservation.id}`
        reservation = await reservation.save()

        res.location(reservation.self).status(201).send()
    } catch(err) {
        console.log(err)
        if(err.name === "ValidationError") {
            return res.status(400).send({ message: "Some fields are empty or undefined"})
        }
        return res.status(404).send({ message: "Insertion not found"})
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

export { router as reservations }