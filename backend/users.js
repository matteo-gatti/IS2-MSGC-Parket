import express from 'express'
import bcrypt from 'bcrypt'

import User from './models/user.js'
import Reservation from './models/reservation.js'
import Parking from './models/parking.js'
import Insertion from './models/insertion.js'

import config from '../config.js'
import tokenChecker from './tokenChecker.js'

const router = express.Router()
const environment = process.env.NODE_ENV
const stage = config[environment]

// Check if users are retrieving their own data
function checkUserAuthorization(req, res) {
    if (req.loggedInUser.userId !== req.params.userId) {
        res.status(403).send({ message: 'User is not authorized to do this action' })
        return false
    }
    return true
}

// Create a new user
router.post('', async (req, res) => {
    const user = new User(req.body)

    // If password is not provided, return error
    if (!req.body.password) {
        return res.status(400).send({ message: 'Some fields are empty or undefined' })
    }

    // Hash the password
    user.password = await bcrypt.hash(user.password, stage.saltingRounds)

    try {
        let newUser = await user.save()
        newUser.self = "/api/v2/users/" + newUser._id

        let userId = newUser._id

        await newUser.save()

        // link to the newly created resource is returned in the location header
        return res.location('/api/v2/users/' + userId).status(201).send()
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(409).json({ message: "Username or email already exists" })
        }
        return res.status(400).json({ message: "Some fields are empty or undefined" })
    }
})

// Get a user
router.get('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    try {
        const user = await User.findById(req.params.userId, { _id: 0, __v: 0 }).populate("parkings")
        return res.status(200).send({ self: user.self, name: user.name, surname: user.surname, email: user.email, username: user.username, parkings: user.parkings })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'User not found' })
    }
})

// Get all reservations of a user
router.get('/:userId/reservations', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    try {
        const reservations = await Reservation.find({ client: { $eq: req.params.userId } }, { _id: 0, __v: 0, client: 0 })
        return res.status(200).json(reservations)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'User not found' })
    }
})

// Update a user
router.put('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return

    let validFields = ["name", "surname", "password", "email"]
    for (let field in req.body) {
        if (!validFields.includes(field)) {
            return res.status(400).send({ message: "Some fields cannot be modified or do not exist" })
        }
    }

    if (req.body["password"]) {
        req.body["password"] = await bcrypt.hash(req.body["password"], stage.saltingRounds)
    }

    try {
        await User.findByIdAndUpdate(req.params.userId, req.body, { runValidators: true })
        return res.status(200).send({ message: 'Update successful' })
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(409).send({ message: "Email is already in use" })
        }
        return res.status(404).send({ message: 'User not found' })
    }
})

// Delete a user and related resources
router.delete('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    try {
        // populate user's parkings
        const user = await User.findById(req.params.userId).populate("parkings")
        for (let parking of user.parkings) {
            // populate parkings' insertions
            const insertions = await Parking.findById(parking._id).populate("insertions")
            for (let insertion of insertions.insertions) {
                // delete insertions' reservations
                await Reservation.deleteMany({ insertion: insertion._id })
                // delete all insertions
                await Insertion.findByIdAndDelete(insertion._id)
            }
            // delete the parking
            await Parking.findByIdAndDelete(parking._id)
        }
        // delete all reservations of the user
        await Reservation.deleteMany({ client: { $eq: req.params.userId } })
        // finally delete the user
        await User.findByIdAndDelete((req.params.userId))
        return res.status(200).send({ message: 'Delete successful' })
    } catch {
        return res.status(404).send({ message: 'User not found' })
    }
})

export { router as users }