import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import User from './models/user.js'

const router = express.Router()

// Route to authenticate a user and get a new token (POST http://localhost:port/api/v1/authentication)
router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        // If user is found and password is right create a token
        var payload = {
            userId: user._id,
            email: user.email
        }
        const token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })
        res.status(200).send({ auth: true, token: token, self: "/api/v1/users/" + user._id })
    } else {
        res.status(401).send({message: 'Wrong username or password'})
    }
})

// Route to deauthenticate a user (POST http://localhost:port/api/v1/deauth)
router.post('/logout', async(req, res) => {
    const token = jwt.sign({userId: "ciao"}, process.env.SUPER_SECRET, {
        expiresIn: 0 // expires in 1 second
    })
    console.log("New token: " + token)
    res.status(200).send({ auth: false, token: token })
})

export default router
