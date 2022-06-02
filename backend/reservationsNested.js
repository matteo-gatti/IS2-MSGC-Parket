import express from 'express'
import moment from 'moment'

import Insertion from './models/insertion.js'
import Reservation from './models/reservation.js'
import User from './models/user.js'
import tokenChecker from './tokenChecker.js'
import Stripe from "./stripe/stripe.js"

const router = express.Router()


// Create a new reservation from an insertion
router.post('/:insertionId/reservations', tokenChecker, async (req, res) => {
    try {

        let insertion = await Insertion.findById(req.params.insertionId).populate(
            [{
                path: "parking",
                model: "Parking",
            },
            {
                path: "reservations",
                model: "Reservation",
            }]
        )
        let user = await User.findById(req.loggedInUser.userId)

        // check if the user is the owner of the parking
        if (req.loggedInUser.userId === insertion.parking.owner.toString()) {
            return res.status(403).send({ message: "User is not authorized to perform this action" })
        }

        // check that correct data fields are sent (w.r.t. the DB model)
        const validFields = ["datetimeStart", "datetimeEnd"]
        for (const field in req.body) {
            if (!validFields.includes(field)) {
                return res.status(400).send({ message: "Some fields are empty or undefined" })
            }
        }

        // check that all the fields are valid
        for (const field of validFields) {
            if (!req.body.hasOwnProperty(field)) {
                return res.status(400).send({ message: "Some fields are empty or undefined" })
            }
        }

        const reqDateStart = new Date(req.body.datetimeStart)
        const reqDateEnd = new Date(req.body.datetimeEnd)

        // check if the insertion's datetimes are valid
        if ((reqDateStart >= reqDateEnd) || insertion.datetimeStart > reqDateStart || insertion.datetimeEnd < reqDateEnd) {
            return res.status(400).send({ message: "Timeslot not valid" })
        }

        if (insertion.recurrent) {
            // can only reserve recurrent insertions on a single day
            const startDateString = moment(reqDateStart).format("YYYY/MM/DD")
            const endDateString = moment(reqDateEnd).format("YYYY/MM/DD")
            if (startDateString !== endDateString) return res.status(400).send({ message: "Recurrent reservation only possible on single day" })

            // check if day is available
            const dayId = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" }
            const startDay = reqDateStart.getDay()
            if (!insertion.recurrenceData.daysOfTheWeek.includes(dayId[startDay])) {
                return res.status(400).send({ message: "Insertion is not available on this day" })
            }
        }
        // check if the insertion is not already reserved
        for (const resv in insertion.reservations) {
            if (reqDateStart >= insertion.reservations[resv].datetimeStart && reqDateStart <= insertion.reservations[resv].datetimeEnd) {
                return res.status(400).send({ message: "Insertion is already reserved for this timeslot" })
            }
            if (reqDateEnd >= insertion.reservations[resv].datetimeStart && reqDateEnd <= insertion.reservations[resv].datetimeEnd) {
                return res.status(400).send({ message: "Insertion is already reserved for this timeslot" })
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

        // compute the price (days * pricePerDay + hoursLeft * pricePerHour)) 
        if (insertion.priceDaily) {
            const dayDiff = moment(reservation.datetimeEnd).diff(moment(reservation.datetimeStart), "days")
            minutesDiff -= dayDiff * 24 * 60
            reservation.price += dayDiff * insertion.priceDaily
        }
        reservation.price += minutesDiff / 60 * insertion.priceHourly
        reservation.price = Math.round(reservation.price * 100) / 100
        reservation.price = reservation.price.toFixed(2)

        reservation = await reservation.save()
        reservation.self = `/api/v2/reservations/${reservation.id}`
        reservation = await reservation.save()

        // Server URL (e.g. http://localhost:3000/)
        const URL = req.protocol + '://' + req.get('host')
        // Create Stripe session to charge the user
        const session = await Stripe.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Prenotazione per il parcheggio: ${insertion.parking.name} - inserzione: ${insertion.name}`,
                        description: `Da: ${moment(reservation.datetimeStart).format("DD/MM/YYYY, hh:mm")} A: ${moment(reservation.datetimeEnd).format("DD/MM/YYYY, hh:mm")}`,
                    },
                    unit_amount: Math.round(reservation.price * 100)
                },
                quantity: 1,
            }],
            success_url: `${URL}/success?insertion=${insertion.id}&reservation=${reservation.id}`,
            cancel_url: `${URL}/cancel?reservation=${reservation.id}`,
        })

        res.location(reservation.self).status(202).json({ url: session.url })
    } catch (err) {
        console.log(err)
        if (err.name === "ValidationError") {
            return res.status(400).send({ message: "Some fields are empty or undefined" })
        }
        return res.status(404).send({ message: "Insertion not found" })
    }
})

// Get all reservations of an insertion
router.get('/:insertionId/reservations', async (req, res) => {
    try {
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