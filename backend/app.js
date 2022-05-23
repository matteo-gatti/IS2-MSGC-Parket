import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { users } from './users.js'
import { parkings } from './parkings.js'
import { insertions } from './insertions.js'
import { insertionsNested } from './insertionsNested.js'
import { reservations } from './reservations.js'
import { reservationsNested } from './reservationsNested.js'
import authentication from './authentication.js'
import statics from './statics.js'

const app = express()

app.use(express.json({limit: '100mb'}))
app.use(cookieParser())
app.use(cors())

app.set('view engine', 'ejs');

// Authentication routing and middleware
app.use('/api/v1/auth', authentication)

// Resource routes
app.use('/api/v1/users', users)
app.use('/api/v1/parkings', parkings)
app.use('/api/v1/parkings', insertionsNested)
app.use('/api/v1/insertions', insertions)
app.use('/api/v1/insertions', reservationsNested)
app.use('/api/v1/reservations', reservations)

// Error handling
app.all( '/api/*', (req, res) => {
    res.status(404)
    res.json({ message: 'Not found' })
})

// Serve static files
app.use('/', statics)

export default app