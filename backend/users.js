import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

import User from './models/user.js'
import config from '../config.js'

const router = express.Router()

const environment = process.env.NODE_ENV
const stage = config[environment]

router.post('', async (req, res) => {
    console.log("Printing new user", req.body)
    const user = new User(req.body)
    user.password = await bcrypt.hash(user.password, stage.saltingRounds)
    await user.save().then((newUser) => {
        let userId = newUser._id
        // Link to the newly created resource is returned in the location header
        res.location('/api/v1/users/' + userId)
        res.contentType('application/json')
        return res.status(200).send({ userId: userId })
    })
        .catch((err) => {
            console.log(err)
            if (err.code === 11000) {
                return res.status(409).send("Username or email already exists")
            }
            return res.status(400).send("Some fields are empty or undefined")
        })
})

router.get('/:userId', async (req, res) => {
    await User.findById(req.params.userId).then((user) => {
        if(user) {
            return res.status(200).json(user)
        }
        return res.status(404).send('User not found')
    }).catch(() => {
        return res.status(404).send('User not found')
    })

})

router.put('/:userId', async (req, res) => {
    if(req.body["username"]) {
        return res.status(400).send("Username cannot be updated")
    }
    if(req.body["password"]) {
        req.body["password"] = await bcrypt.hash(req.body["password"], stage.saltingRounds)
    }
    await User.findByIdAndUpdate(req.params.userId, req.body).then(() => {
        return res.status(200).send('Update successful')
    }).catch((err) => {
        console.log(err)
        return res.status(404).send('User not found')
    })

    /* await User.findById(req.params.userId).then((user) => {
        user
        await user.save()
        return res.status(200).json(user)
    }).catch(() => {
        return res.status(404).send('User not found')
    }) */

    /* await User.updateOne({_id: req.params.id}, req.body)
    return res.status(200).send('Update successful') */
})

router.delete('/:userId', async (req, res) => {
    await User.findByIdAndDelete((req.params.userId)).then(() => {
        return res.status(200).send('User deleted')
    }).catch(() => {
         return res.status(404).send('User not found')
    })
})

export { router as users }