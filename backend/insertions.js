import express from 'express'

import Insertion from './models/insertion.js'
import Reservation from './models/reservation.js'
import Parking from './models/parking.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'
import async from 'async'

const router = express.Router()

// Create a new insertion
router.post('/:parkId/insertions', tokenChecker, async (req, res) => {
    try {
        let parking = await Parking.findById(req.params.parkId).populate("owner")
        if(req.loggedInUser.userId !== parking.owner.id) {
            return res.status(403).send({ message: "User is not authorized to perform this action" })
        }
        let insertion = new Insertion()
        insertion.name = req.body.name
        
        insertion.parking = parking
        insertion = await insertion.save()
        
        for(const resv of req.body.reservations) {
            let reservation = new Reservation()
            reservation.datetimeStart = resv.datetimeStart
            reservation.datetimeEnd = resv.datetimeEnd
            reservation.insertion = insertion
            reservation = await reservation.save()

            reservation.self = "/api/v1/reservations/" + reservation.id
            reservation = await reservation.save()
            insertion.reservations.push(reservation)
        }

        insertion.self = "/api/v1/parkings/" + req.params.parkId + "/insertions/" + insertion.id
        insertion = await insertion.save()

        parking.insertions.push(insertion)
        await parking.save()

        // link to the newly created resource is returned in the location header
        res.location('/api/v1/parkings/' + req.params.parkId + "/insertions/" + insertion.id ).status(201).send()
    } catch(err) {
        console.log(err)
        return res.status(400).send({ message: "Some fields are empty or undefined" })
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
    // if user is trying to change the parking's owner, return error
    if (req.body["owner"]) {
        return res.status(400).send({ message: "Owner cannot be updated"} )
    }
    try {
        const parking = await Parking.findById(req.params.parkingId)

        let parkingOwner = parking.owner
        // if user is not the owner of the parking, return error
        if (parkingOwner.substring(parkingOwner.lastIndexOf('/') + 1) !== req.loggedInUser.userId) {
            return res.status(403).send({ message: 'User is not authorized to do this action' })
        }

        if (req.body.name) parking.name = req.body.name
        if (req.body.address) parking.address = req.body.address
        if (req.body.city) parking.city = req.body.city
        if (req.body.country) parking.country = req.body.country
        if (req.body.description) parking.description = req.body.description
        if (req.body.image) parking.image = req.body.image
        if (req.body.latitude) parking.latitude = req.body.latitude
        if (req.body.longitude) parking.longitude = req.body.longitude

        let updatedParking = await parking.save()
        return res.status(200).json(updatedParking)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

//TODO Delete a parking
router.delete('/:parkId/insertions/:insertionId', tokenChecker, async (req, res) => {
    try {
        const parking = await Parking.findById(req.params.parkingId)

        let parkingOwner = parking.owner
        // if user is not the owner of the parking, return error
        if (parkingOwner.substring(parkingOwner.lastIndexOf('/') + 1) !== req.loggedInUser.userId) {
            return res.status(403).send({ message: 'User is not authorized to do this action' })
        }

        await parking.remove()
        return res.status(200).send({ message: 'Parking deleted' })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})


export { router as insertions }