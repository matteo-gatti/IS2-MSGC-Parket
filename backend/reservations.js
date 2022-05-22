import express from 'express'
import moment from 'moment'

import Insertion from './models/insertion.js'
import Reservation from './models/reservation.js'
import User from './models/user.js'

import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

const router = express.Router()

router.get('/myReservations', tokenChecker, async (req, res) => {
/*     if (!isAuthToken(req)) {
        return res.status(401).send({ message: 'Token missing or invalid' })
    } */
    try {
        //let reservations = await Insertion.findById(req.params.insertionId, {reservations: 1}).populate("reservations", {_id: 0, __v:0, insertion: 0})
        let reservations = await Reservation.find({client: {$eq: req.loggedInUser.userId}}, { _id: 0, __v: 0 }).populate("insertion")
        return res.status(200).json(reservations)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Reservations not found" })
    }
})

router.get('/:reservationId', async (req, res) => {
    try {
        //let reservations = await Insertion.findById(req.params.insertionId, {reservations: 1}).populate("reservations", {_id: 0, __v:0, insertion: 0})
        let reservations = await Reservation.findById(req.params.reservationId, { _id: 0, __v: 0 }).populate(
            {
                path: "client",
                model: "User",
                select: { self: 1 }
            })
        return res.status(200).json(reservations)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Insertion not found" })
    }
})


export { router as reservations }