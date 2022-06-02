import express from 'express'

import { tokenValid, isAuthToken } from './tokenChecker.js'
import Parking from './models/parking.js'
import Insertion from './models/insertion.js'
import Reservation from './models/reservation.js'

const router = express.Router()

// Login page
router.get('/login', tokenValid, function (req, res) {
    if (!isAuthToken(req)) {
        res.render('./login.ejs', { logged: false })
    }
    else {
        res.redirect("/")
    }
})

// Register page
router.get('/register', tokenValid, function (req, res) {
    if (!isAuthToken(req))
        res.render('./register.ejs', { logged: false })
    else
        res.redirect("/")
})

// Success after correct payment
router.get('/success', tokenValid, async function (req, res) {
    if (isAuthToken(req)) {
        try {
            const insId = req.query.insertion
            const resId = req.query.reservation
            let reservation = await Reservation.findById(resId)
            let insertion = await Insertion.findById(insId).populate("reservations parking")
            let parking = await Parking.findById(insertion.parking.id).populate("owner")
            insertion.reservations.push(reservation)
            await insertion.save()
            if (req.loggedInUser.userId !== parking.owner.id) {
                res.status(201).render('./insertion.ejs', { logged: true, owner: false })
            } else {
                res.status(201).render('./insertion.ejs', { logged: true, owner: true })
            }
        } catch(err){
            console.log(err)
            res.redirect("/")
        }
    }
    else
        res.redirect("/")
})

// Error after payment canceled successfully
router.get('/cancel', tokenValid, async function (req, res) {
    if (isAuthToken(req)) {
        try {
            const resId = req.query.reservation
            let reservation = await Reservation.findById(resId)
            if (reservation !==null) {
                await reservation.remove()
            }
            res.render('./cancel.ejs', { logged: true })
        } catch(err){
            console.log(err)
            res.redirect("/")
        }
    }
    else
        res.redirect("/")
})

// Private area page
router.get('/privateArea', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        res.render('./privateArea.ejs', { logged: true, usr: req.loggedInUser.userId})
    }
    else
        res.redirect("/login")
})

// Insertion page
router.get('/insertion', tokenValid, async function (req, res) {
    if (isAuthToken(req)) {
        try {
            let insertion = await Insertion.findById(req.query.insertion).populate("parking")
            let parking = await Parking.findById(insertion.parking.id).populate("owner")

            if (req.loggedInUser.userId !== parking.owner.id) {
                res.render('./insertion.ejs', { logged: true, owner: false })
            } else {
                res.render('./insertion.ejs', { logged: true, owner: true })
            }
        } catch (err) {
            console.log(err)
            res.render("./404page.ejs", { logged: true })
        }
    }
    else
        res.redirect("/login")
})

// Form page for creating a new parking
router.get('/createParking', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        res.render('./newPark.ejs', { logged: true })
    }
    else
        res.redirect("/login")
})

// Form page to modify a parking
router.get('/modifyParking', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        res.render('./modifyPark.ejs', { logged: true })
    }
    else
        res.redirect("/login")
})

// Form page for creating a new parking and a new insertion together
router.get('/createParkingInsertion', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        res.render('./newParkFromInsertion.ejs', { logged: true })
    }
    else
        res.redirect("/login")
})

// Detail of a parking page
router.get('/detailParking', tokenValid, async function (req, res) {
    if (isAuthToken(req)) {
        try {
            let parking = await Parking.findById(req.query.id).populate("owner")
            const reservations = await Reservation.find({ client: req.loggedInUser.userId, reviewed: false })
            let reviewable = false
            if (reservations.length !== 0) {
                reviewable = true
            }
            if (req.loggedInUser.userId !== parking.owner.id) {
                res.render('./detailParking.ejs', { logged: true, owner: false, reviewable: reviewable })
            } else {
                res.render('./detailParking.ejs', { logged: true, owner: true, reviewable: reviewable })
            }
        } catch (err) {
            console.log(err)
            res.render("./404page.ejs", { logged: true })
        }
    }
    else
        res.redirect("/login")
})

// Public parkings page
router.get('/parkings', tokenValid, function (req, res) {
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render('./parkings.ejs', { logged: loggedBool })

})

// Map page
router.get('/map', tokenValid, function (req, res) {
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render('./map.ejs', { logged: loggedBool})
})

// Info page
router.get('/info', tokenValid, function (req, res) {
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render('./info.ejs', { logged: loggedBool })
})

// Index page
router.get('/', tokenValid, function (req, res) {
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render('./index.ejs', { logged: loggedBool })
})

// Static files (e.g. JS scripts, images, logo...)
router.use('', express.static('static'))

// 404 page
router.all('*', tokenValid, (req, res) => { 
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render("./404page.ejs", { logged: loggedBool }) 
})

export default router