import express from 'express'

import User from './models/user.js'
import Review from './models/review.js'
import Parking from './models/parking.js'
import Reservation from './models/reservation.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'

const router = express.Router()

// Create a new review
router.post('/:parkId/reviews', tokenChecker, async (req, res) => {
    try {
        let parking = await Parking.findById(req.params.parkId).populate("owner")
        let user = await User.findById(req.loggedInUser.userId)

        // check that correct data is sent
        const validInsertionFields = ["title", "stars", "description", "reservation"]

        for (const field in req.body) {
            if (!validInsertionFields.includes(field)) {
                return res.status(400).send({ message: "Some fields are invalid" })
            }
        }

        // check if stars is between 1 and 5
        if (req.body.stars < 1 || req.body.stars > 5 || !Number.isInteger(req.body.stars)) {
            return res.status(400).send({ message: "Stars must be integer between 0 and 5" })
        }

        // create the review
        let review = new Review()
        review.title = req.body.title
        review.stars = req.body.stars
        review.description = req.body.description
        review.parking = parking
        review.writer = user
        review.datetime = new Date()

        // get the reservation
        const reservation = await Reservation.findById(req.body.reservation)
        reservation.reviewed = true
        await reservation.save()

        review.reservation = reservation
        review = await review.save()

        review.self = "/api/v1/parkings/" + parking.id + "/reviews/" + review.id //TODO se viene fatto reviews non nested va cambiato

        review = await review.save()

        parking.reviews.push(review)
        await parking.save()

        // link to the newly created resource is returned in the location header
        res.location("/api/v1/parkings/" + parking.id + "/reviews/" + review.id).status(201).send()
    } catch (err) {
        console.log(err)
        if (err.name === "ValidationError") {
            return res.status(400).send({ message: "Some fields are empty or undefined" })
        }
        return res.status(404).send({ message: "Parking not found" })
    }
})

// Get all the insertions of a parking
router.get('/:parkId/reviews', async (req, res) => {
    try {
        let review = await Parking.findById(req.params.parkId, { reviews: 1, _id: 0 }).populate({
            path: "reviews",
            model: "Review",
            select: { _id: 0, parking: 0, __v: 0 },
            populate: [{
                path: "writer",
                model: "User",
                select: { self: 1, _id: 0, username: 1 }
            },
            {
                path: "reservation",
                model: "Reservation",
                select: { datetimeStart: 1, datetimeEnd: 1 },
            }]
        })
        let average = 0
        review["reviews"].forEach((review) => {
            average += review.stars
        })
        average = average / review["reviews"].length

        return res.status(200).json({ reviews: review["reviews"], average: average })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: "Parking not found" })
    }
})

export { router as reviewsNested }