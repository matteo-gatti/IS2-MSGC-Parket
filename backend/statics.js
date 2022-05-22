import express from 'express'

import { tokenValid, isAuthToken } from './tokenChecker.js'
import Parking from './models/parking.js'
import Insertion from './models/insertion.js'
import user from './models/user.js'

const router = express.Router()

router.get('/login', tokenValid, function (req, res) {
    if (!isAuthToken(req)) {
        res.render('./login.ejs', { logged: false })
        //res.sendFile('./static/login.html', { root: '.'})
    }
    else {
        res.redirect("/")
    }
})

router.get('/register', tokenValid, function (req, res) {
    if (!isAuthToken(req))
        res.render('./register.ejs', { logged: false })
    //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/")
})

router.get('/privateArea', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        console.log("auth and render")
        res.render('./parkings.ejs', { logged: true })
    }
    //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
})

router.get('/userArea', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        res.render('./userArea.ejs', { logged: true, usr: req.loggedInUser.userId })
    }
    else
        res.redirect("/login")
})

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

router.get('/createParking', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        res.render('./newPark.ejs', { logged: true })
    }
    //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
})

router.get('/createParkingInsertion', tokenValid, function (req, res) {
    if (isAuthToken(req)) {
        res.render('./newParkFromInsertion.ejs', { logged: true })
    }
    //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
})

router.get('/detailParking', tokenValid, async function (req, res) {
    if (isAuthToken(req)) {
        try {
            let parking = await Parking.findById(req.query.id).populate("owner")
            console.log(parking)
            if (req.loggedInUser.userId !== parking.owner.id) {
                res.render('./detailParking.ejs', { logged: true, owner: false })
            } else {
                res.render('./detailParking.ejs', { logged: true, owner: true })
            }
        } catch (err) {
            console.log(err)
            res.render("./404page.ejs", { logged: true })
        }
    }
    //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
})


router.get('/publicParkings', tokenValid, function (req, res) {
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render('./PublicParkings.ejs', { logged: loggedBool })

})

router.get('/', tokenValid, function (req, res) {
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render('./index.ejs', { logged: loggedBool })
    //res.sendFile('./static/index.html', { root: '.'})
    //res.sendFile('./static/loggedIn.html', { root: '.'})
})

router.use('', express.static('static'))

//router.all('/*', (req, res) => {res.redirect('/') })
router.all('*', tokenValid, (req, res) => { 
    let loggedBool = false
    if (isAuthToken(req))
        loggedBool = true
    res.render("./404page.ejs", { logged: loggedBool }) 
})


//router.put()

//router.post()

//router.delete()


export default router