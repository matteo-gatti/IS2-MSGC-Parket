import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import User from './models/user.js'
import config from '../config.js'
import tokenChecker from './tokenChecker.js'

const router = express.Router()

const environment = process.env.NODE_ENV
const stage = config[environment]

function checkUserAuthorization(req, res) {
    if (req.loggedInUser.userId !== req.params.userId) {
        res.status(403).send({ message: 'User is not authorized to do this action' })
        return false
    }
    return true
}

router.post('', async (req, res) => {
    console.log("Printing new user", req.body)
    const user = new User(req.body)
    user.self = "/api/v1/users/" + user.id
    // if password is not provided, return error
    if (!req.body.password) {
        return res.status(400).send({ message: 'Password is required' })
    }
    user.password = await bcrypt.hash(user.password, stage.saltingRounds)
    try {
        let newUser = await user.save()
        let userId = newUser._id
        // link to the newly created resource is returned in the location header
        return res.location('/api/v1/users/' + userId).status(200).send()
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "Username or email already exists" })
        }
        return res.status(400).json({ message: "Some fields are empty or undefined" })
    }
})

router.get('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    try {
        console.log("Printing user", req.params.userId)
        const user = await User.findById(req.params.userId).populate("parkings")
        console.log(user)
        return res.status(200).send({ name: user.name, surname: user.surname, email: user.email, username: user.username, parkings: user.parkings })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'User not found' })
    }
})

router.put('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    if (req.body["username"]) {
        return res.status(400).send({ message: "Username cannot be updated" })
    }
    if (req.body["password"]) {
        req.body["password"] = await bcrypt.hash(req.body["password"], stage.saltingRounds)
    }
    try {
        await User.findByIdAndUpdate(req.params.userId, req.body, { runValidators: true })
        return res.status(200).send({ message: 'Update successful' })
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(409).send({ message: "Email is already in use" })
        }
        return res.status(404).send({ message: 'User not found' })
    }
})

router.delete('/:userId', tokenChecker, async (req, res) => {
    if (!checkUserAuthorization(req, res)) return
    try {
        await User.findByIdAndDelete((req.params.userId))
        return res.status(200).send({ message: 'User deleted' })
    } catch {
        return res.status(404).send({ message: 'User not found' })
    }
})

export { router as users }