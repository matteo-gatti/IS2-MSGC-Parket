import express from 'express'
import User from './models/user.js'
import moment from 'moment'

import Reservation from './models/reservation.js'
import Review from './models/review.js'
import Insertion from './models/insertion.js'
import tokenChecker from './tokenChecker.js'

const router = express.Router()

// Get all the user's reservations
router.get('/myReservations', tokenChecker, async (req, res) => {
    try {
        let user = await User.findById(req.loggedInUser.userId)
        if (user == null) throw new Error()
        let reservations = await Reservation.find({ client: { $eq: req.loggedInUser.userId } }, { __v: 0 }).populate(
            {
                path: "insertion",
                model: "Insertion",
                select: { __v: 0 },
                populate: [{
                    path: "parking",
                    model: "Parking",
                    select: { self: 1, name: 1, owner: 1 },
                    populate: [{
                        path: "owner",
                        model: "User",
                        select: { email: 1 }
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

// Modify a reservation
router.put('/:reservationId', tokenChecker, async (req, res) => {
    const validReservationFields = ["id", "datetimeStart", "datetimeEnd"]
    for (const field in req.body) {
        if (!validReservationFields.includes(field)) {
            return res.status(400).send({ message: "Some fields cannot be modified" })
        }
    }

    try {
        let reservation = await Reservation.findById(req.params.reservationId)

        if (reservation.client.toString() != req.loggedInUser.userId) {
            return res.status(403).send({ message: "You are not allowed to modify this reservation" })
        }

        // if datetimeStart or datetimeEnd are not sent, return error
        if (!req.body.datetimeStart || !req.body.datetimeEnd) {
            return res.status(400).send({ message: "Some fields are empty or undefined" })
        }

        // check that the new reservation is not in the past
        if (new Date(req.body.datetimeStart) < new Date()) {
            return res.status(400).send({ message: "The new reservation is in the past" })
        }

        // if datetimeStart is after datetimeEnd, return error
        if (new Date(req.body.datetimeStart) > new Date(req.body.datetimeEnd)) {
            return res.status(400).send({ message: "Datetime start cannot be after datetime end" })
        }

        let insertion = await Insertion.findById(reservation.insertion).populate({
            path: "reservations",
            model: "Reservation",
            select: { _id: 1, datetimeStart: 1, datetimeEnd: 1 }
        })

        // if the new reservation is outside the timeslot of the insertion, return error
        if (new Date(req.body.datetimeStart) < new Date(insertion.datetimeStart) || new Date(req.body.datetimeEnd) > new Date(insertion.datetimeEnd)) {
            return res.status(400).send({ message: "The new reservation is outside the timeslot of the insertion" })
        }

        // if the new timeslot collide with other reservations, return error
        for (const reservation of insertion.reservations) {
            if (reservation.id != req.params.reservationId) {
                if (new Date(req.body.datetimeStart) >= new Date(reservation.datetimeStart) && new Date(req.body.datetimeStart) < new Date(reservation.datetimeEnd)) {
                    return res.status(400).send({ message: "The new reservation is overlapping with another reservation" })
                }
                if (new Date(req.body.datetimeEnd) > new Date(reservation.datetimeStart) && new Date(req.body.datetimeEnd) <= new Date(reservation.datetimeEnd)) {
                    return res.status(400).send({ message: "The new reservation is overlapping with another reservation" })
                }
            }
        }

        if (insertion.recurrent) {
            // check that the new reservation is in the same days of the week of the insertion
            let newReservationDay = new Date(req.body.datetimeStart).getDay()
            let days = new Map()
            days.set(0, "sunday")
            days.set(1, "monday")
            days.set(2, "tuesday")
            days.set(3, "wednesday")
            days.set(4, "thursday")
            days.set(5, "friday")
            days.set(6, "saturday")
            if (!insertion.recurrenceData.daysOfTheWeek.includes(days.get(newReservationDay))) {
                return res.status(400).send({ message: "The insertion is not available in these days of the week" })
            }

            // check that the new reservation is the same day
            if (new Date(req.body.datetimeStart).getDate() != new Date(req.body.datetimeEnd).getDate()) {
                return res.status(400).send({ message: "The new reservation is on multiple days" })
            }
        }

        // recalculate the price
        // convenient price is not keeped anymore
        // if one is changing the price, the price is recalculated
        reservation.price = 0
        let minutesDiff = moment(req.body.datetimeEnd).diff(moment(req.body.datetimeStart), "minutes")
        if (minutesDiff < insertion.minInterval) {
            return res.status(400).send({ message: "Minimum reservation time interval not met" })
        }

        if (insertion.priceDaily) {
            const dayDiff = moment(req.body.datetimeEnd).diff(moment(req.body.datetimeStart), "days")
            minutesDiff -= dayDiff * 24 * 60
            reservation.price += dayDiff * insertion.priceDaily
        }
        reservation.price += minutesDiff / 60 * insertion.priceHourly

        // if all went smoothly, update the reservation
        reservation.datetimeStart = req.body.datetimeStart
        reservation.datetimeEnd = req.body.datetimeEnd
        reservation = await reservation.save({ _id: 0, __v: 0, new: true })

        return res.status(200).json(reservation)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Reservation not found" })
    }
})

// Delete a specific reservation
router.delete('/:reservationId', tokenChecker, async (req, res) => {
    try {
        let test = await Reservation.findById(req.params.reservationId, { _id: 0, __v: 0 })
        if (String(test.client) !== req.loggedInUser.userId) {
            return res.status(403).send({ message: "User doesn't have the permission to delete this Reservation" })
        }
       
        let reservation = await Reservation.findById(req.params.reservationId)
        let date = reservation.datetimeStart
        let diff = moment(new Date()).diff(moment(date), "days")
        if (-diff < 2) {
            return res.status(400).send({ message: "Reservation cannot be deleted before two days" })
        }

        await Review.findOneAndDelete({ reservation: req.params.reservationId })

        await Reservation.findOneAndDelete({ _id: req.params.reservationId })

        return res.status(200).send({ message: "Reservation deleted" })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Reservation not found" })
    }
})

export { router as reservations }
