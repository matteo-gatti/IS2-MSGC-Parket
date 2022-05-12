import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

router.get('', (req, res) => {
    res.send('Hello World!')
  })

//router.put()

//router.post()

//router.delete()

export { router as users }