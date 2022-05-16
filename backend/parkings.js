import express from 'express'

import Parking from './models/parking.js'
import tokenChecker from './tokenChecker.js'
import User from './models/user.js'

const router = express.Router()

// Create a new parking
router.post('', tokenChecker, async (req, res) => {
    let parking = new Parking(req.body)
    // set the owner of the parking to the logged in user
    parking.owner = '/api/v1/users/' + req.loggedInUser.userId
    try {
        console.log("Printing new parking", parking)
        let newParking = await parking.save()

        let parkingId = newParking._id

        // add reference into the user object
        let user = await User.findById(req.loggedInUser.userId)
        user.parkings.push('/api/v1/parkings/' + parkingId)
        await user.save()

        // link to the newly created resource is returned in the location header
        res.location('/api/v1/parkings/' + parkingId).status(200).send()
    } catch(err) {
        console.log(err)
        return res.status(400).send({ message: "Some fields are empty or undefined" })
    }
})

// Get a parking
router.get('/:parkingId', async (req, res) => {
    try {
        console.log("Printing parking", req.params.parkingId)
        const parking = await Parking.findById(req.params.parkingId)
        return res.status(200).json(parking)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

// Get all parkings
router.get('', async (req, res) => {
    try {
        console.log(req.params)
        const parkings = await Parking.find()
        return res.status(200).json(parkings)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parkings not found' })
    }
})

// Modify a parking
router.put('/:parkingId', tokenChecker, async (req, res) => {
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

// Delete a parking
router.delete('/:parkingId', tokenChecker, async (req, res) => {
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


export { router as parkings }