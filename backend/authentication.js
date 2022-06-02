import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import User from './models/user.js'

const router = express.Router()

// Route to authenticate a user and get a new token
router.post('/login', async (req, res) => {

    const user = (req.body.identifier && req.body.identifier.includes("@"))
        ? await User.findOne({ email: req.body.identifier })
        : await User.findOne({ username: req.body.identifier });

    if (user && await bcrypt.compare(req.body.password, user.password)) {
        // if user is found and password is right create a token
        var payload = {
            userId: user._id,
            email: user.email
        }
        const token = jwt.sign(payload, process.env.SUPER_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })
        res.status(200).json({ auth: true, token: token, self: "/api/v2/users/" + user._id })
    } else {
        res.status(401).json({ message: 'Wrong identifier or password' })
    }
})

// Route to deauthenticate a user
router.post('/logout', async (req, res) => {
    const token = jwt.sign({ userId: "goodbye" }, process.env.SUPER_SECRET, {
        expiresIn: 0 // expires in 0 seconds
    })
    res.status(200).send({ auth: false, token: token })
})

export default router