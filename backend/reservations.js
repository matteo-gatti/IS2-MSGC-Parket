import express from 'express'
import User from './models/user.js'
import Reservation from './models/reservation.js'
import User from './models/user.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

const router = express.Router()

// Get all the user's reservations
router.get('/myReservations', tokenChecker, async (req, res) => {
    try {
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
                    select: {self: 1, name: 1, owner:1},
                        populate: [{
                            path: "owner",
                            model: "User",
                            select: {email: 1}
                        }]
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

//Delete a specific reservation
router.delete('/:reservationId', tokenChecker, async (req, res) => {
    try {
        let test = await Reservation.findById(req.params.reservationId, { _id: 0, __v: 0 })
        if(String(test.client) !== req.loggedInUser.userId) {
            return res.status(403).send({message: "User doesn't have the permission to delete this Reservation"})
        }

        await Reservation.findOneAndDelete({_id: req.params.reservationId})
        
        return res.status(200).send({message: "Reservation deleted"})
    } catch(err) {
        console.log(err)
        return res.status(404).send({message: "Reservation not found" })
    }
})

export { router as reservations }