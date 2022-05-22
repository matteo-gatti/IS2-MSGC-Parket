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
        if (req.loggedInUser.userId !== parking.owner.id) {
            return res.status(403).send({ message: "User is not authorized to perform this action" })
        }

        // check if the insertion's datetimes are valid
        if ((new Date(req.body.datetimeStart)) >= (new Date(req.body.datetimeEnd))) {
            return res.status(400).send({ message: "Timeslot not valid or not available" })
        }

        // create the insertion
        let insertion = new Insertion()
        insertion.name = req.body.name
        insertion.parking = parking
        insertion.datetimeStart = req.body.datetimeStart
        insertion.datetimeEnd = req.body.datetimeEnd
        insertion.priceHourly = req.body.priceHourly
        if (req.body.minInterval) insertion.minInterval = req.body.minInterval
        if (req.body.priceDaily) insertion.priceDaily = req.body.priceDaily

        // check if the user wants a recurring insertion
        if (req.body.recurrent == true) {
            insertion.recurrent = true
            insertion.recurrenceData = req.body.recurrenceData
        }

        insertion = await insertion.save()

        
        insertion.self = "/api/v1/insertions/" + insertion.id
        //si potrebbe unificare togliendo la parte parkings? per omogeneità della risorsa
        insertion = await insertion.save()

        parking.insertions.push(insertion)
        await parking.save()

        // link to the newly created resource is returned in the location header
        res.location('/api/v1/insertions/' + insertion.id).status(201).send()
    } catch (err) {
        console.log(err)
        if (err.name === "ValidationError") {
            return res.status(400).send({ message: "Some fields are empty or undefined" })
        }
        return res.status(404).send({ message: "Parking or owner not found" })
    }
})

// Get all the insertions of a parking
router.get('/:parkId/insertions', async (req, res) => {
    try {
        let insertion = await Parking.findById(req.params.parkId, { insertions: 1 }).populate({
            path: "insertions",
            model: "Insertion",
            select: { _id: 0, parking: 0, __v: 0 },
            populate: [{
                path: "reservations",
                model: "Reservation",
                select: { _id: 0, __v: 0, insertion: 0 },
                populate: {
                    path: "client",
                    model: "User",
                    select: { self: 1 }
                }
            }]

        })
        //"insertions").populate("insertions.reservations", {_id: 0, __v:0, insertion: 0}).populate("insertions.reservations.client")

        console.log(insertion)
        return res.status(200).json(insertion)
    } catch (err) {
        console.log(err)
        return res.status(400).send({ message: "Some fields are empty or undefined" })
    }
})

export { router as insertionsNested }