import express from 'express'

import { tokenValid, isAuthToken } from './tokenChecker.js'

const router = express.Router()

router.get('/login', tokenValid, function(req, res){
    if(!isAuthToken(req)) {
        res.render('./login.ejs', {logged: false})
        //res.sendFile('./static/login.html', { root: '.'})
    }
    else {
        res.redirect("/")
    }
})

router.get('/register', tokenValid, function(req, res){
    if(!isAuthToken(req))
        res.render('./register.ejs', {logged: false})
        //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/")
})

router.get('/privateArea', tokenValid, function(req, res){
    if(isAuthToken(req)){
        console.log("auth and render")
        res.render('./parkings.ejs', {logged: true})
    }
        //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
})

router.get('/createParking', tokenValid, function(req, res){
    if(isAuthToken(req)){
        res.render('./newPark.ejs', {logged: true})
    }
        //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
})

router.get('/createParkingInsertion', tokenValid, function(req, res){
    if(isAuthToken(req)){
        res.render('./newParkFromInsertion.ejs', {logged: true})
    }
        //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
})

router.get('/detailParking', tokenValid, function(req, res){
    if(isAuthToken(req)){
        console.log("richiesta pagina dettaglio")
        res.render('./detailParking.ejs', {logged: true})
    }
        //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/login")
    })
    
    
router.get('/publicParkings', tokenValid, function(req, res){
        let loggedBool = false
        if(isAuthToken(req))
            loggedBool = true
        res.render('./PublicParkings.ejs', {logged: loggedBool})
    
    })

router.get('/', tokenValid, function(req, res){
    let loggedBool = false
    if(isAuthToken(req))
        loggedBool = true
    res.render('./index.ejs', {logged: loggedBool})
        //res.sendFile('./static/index.html', { root: '.'})
        //res.sendFile('./static/loggedIn.html', { root: '.'})
})


//router.all('/*', (req, res) => {res.redirect('/') })

router.use('', express.static('static'))

//router.put()

//router.post()

//router.delete()

export default router