import express from 'express'

import { tokenValid } from './tokenChecker.js'

const router = express.Router()

function isAuthToken(req) {
    if(!req.loggedInUser) {
        return false
    }
    return true
}

router.get('/login', tokenValid, function(req, res){
    if(!isAuthToken(req)) {
        res.render('./login.ejs')
        //res.sendFile('./static/login.html', { root: '.'})
    }
    else {
        res.redirect("/")
    }
})

router.get('/register', tokenValid, function(req, res){
    if(!isAuthToken(req))
        res.render('./register.ejs')
        //res.sendFile('./static/register.html', { root: '.'})
    else
        res.redirect("/")
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