import express from 'express'
import User from './models/user.js'
import Reservation from './models/reservation.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

const router = express.Router()

// Get all the user's reservations
router.get('/myReservations', tokenChecker, async (req, res) => {
    try {
        console.log("2end2", req.loggedInUser.userId)
        let user = await User.findById(req.loggedInUser.userId)
        if (user == null) throw new Error()
        let reservations = await Reservation.find({client: {$eq: req.loggedInUser.userId}}, { _id: 0, __v: 0 }).populate(
            {
                path: "insertion",
                model: "Insertion",
                select: {__v:0},
                populate: [{
                    path: "parking",
                    model: "Parking",
                    select: {self: 1, name: 1}
                }]
            }
        )
        return res.status(200).json(reservations)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "User not found" })
    }
})

// Get a specific reservation
router.get('/:reservationId', async (req, res) => {
    try {
        let reservations = await Reservation.findById(req.params.reservationId, { _id: 0, __v: 0 }).populate(
            {
                path: "client",
                model: "User",
                select: { self: 1 }
            })
        return res.status(200).json(reservations)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Reservation not found" })
    }
})


export { router as reservations }