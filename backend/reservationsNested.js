import express from 'express'
import moment from 'moment'

import Insertion from './models/insertion.js'
import Reservation from './models/reservation.js'
import User from './models/user.js'

import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

const router = express.Router()

// Create a new reservation
router.post('/:insertionId/reservations', tokenChecker, async (req, res) => {
    try {
        let insertion = await Insertion.findById(req.params.insertionId).populate("reservations parking")
        let user = await User.findById(req.loggedInUser.userId)

        // check if the user is the owner of the parking
        if (req.loggedInUser.userId === insertion.parking.owner) {
            return res.status(403).send({ message: "User is not authorized to perform this action" })
        }

        const reqDateStart = new Date(req.body.datetimeStart)
        const reqDateEnd = new Date(req.body.datetimeEnd)

        console.log(insertion)

        // check if the insertion's datetimes are valid
        if ((reqDateStart >= reqDateEnd) || insertion.datetimeStart > reqDateStart || insertion.datetimeEnd < reqDateEnd) {
            return res.status(400).send({ message: "Timeslot not valid or not available" })
        }

        if (insertion.recurrent) {
            // can only reserve recurrent insertions on a single day
            const startDateString = moment(reqDateStart).format("YYYY/MM/DD")
            const endDateString = moment(reqDateEnd).format("YYYY/MM/DD")
            if (startDateString !== endDateString) return res.status(400).send({ message: "Timeslot not valid or not available" })

            // check if day is available
            const dayId = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" }
            const startDay = reqDateStart.getDay()
            if (!insertion.recurrenceData.daysOfTheWeek.includes(dayId[startDay])) {
                return res.status(400).send({ message: "Timeslot not valid or not available" })
            }
        } 
        // check if the insertion is not already reserved
        for (const resv in insertion.reservations) {
            if (reqDateStart >= insertion.reservations[resv].datetimeStart && reqDateStart <= insertion.reservations[resv].datetimeEnd) {
                return res.status(400).send({ message: "Timeslot not valid or not available" })
            }
            if (reqDateEnd >= insertion.reservations[resv].datetimeStart && reqDateEnd <= insertion.reservations[resv].datetimeEnd) {
                return res.status(400).send({ message: "Timeslot not valid or not available" })
            }
        }

        // create the reservation
        let reservation = new Reservation(req.body)
        reservation.client = user
        reservation.insertion = insertion
        reservation.datetimeStart = req.body.datetimeStart
        reservation.datetimeEnd = req.body.datetimeEnd

        reservation.price = 0
        let minutesDiff = moment(reservation.datetimeEnd).diff(moment(reservation.datetimeStart), "minutes")
        if (minutesDiff < insertion.minInterval) {
            return res.status(400).send({ message: "Minimum reservation time interval not met" })
        }

        if (insertion.priceDaily) {
            const dayDiff = moment(reservation.datetimeEnd).diff(moment(reservation.datetimeStart), "days")
            minutesDiff -= dayDiff * 24 * 60
            reservation.price += dayDiff * insertion.priceDaily
        }
        reservation.price += minutesDiff / 60 * insertion.priceHourly

        reservation = await reservation.save()
        reservation.self = `/api/v1/reservations/${reservation.id}`
        reservation = await reservation.save()

        insertion.reservations.push(reservation)
        await insertion.save()

        res.location(reservation.self).status(201).send()
    } catch (err) {
        console.log(err)
        if (err.name === "ValidationError") {
            return res.status(400).send({ message: "Some fields are empty or undefined" })
        }
        return res.status(404).send({ message: "Insertion not found" })
    }
})

router.get('/:insertionId/reservations', async (req, res) => {
    try {
        //let reservations = await Insertion.findById(req.params.insertionId, {reservations: 1}).populate("reservations", {_id: 0, __v:0, insertion: 0})
        let reservations = await Insertion.findById(req.params.insertionId, { reservations: 1 }).populate(
            {
                path: "reservations",
                model: "Reservation",
                select: { _id: 0, __v: 0, insertion: 0 },
                populate: [
                    {
                        path: "client",
                        model: "User",
                        select: { self: 1, username: 1 }
                    }]
            })
        return res.status(200).json(reservations)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Insertion not found" })
    }
})

export { router as reservationsNested }