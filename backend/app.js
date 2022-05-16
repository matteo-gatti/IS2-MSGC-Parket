import express from 'express'
import cookieParser from 'cookie-parser'
import { users } from './users.js'
import { parkings } from './parkings.js'
import authentication from './authentication.js'
import tokenChecker from './tokenChecker.js'
import statics from './statics.js'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs');
// Serve static files
app.use('/', statics)

// Authentication routing and middleware
app.use('/api/v1/auth', authentication)

// Protect endpoints with JWT
// TODO: add something like app.use('/api/v1/', tokenChecker)

// Resource routes
app.use('/api/v1/users', users)
app.use('/api/v1/parkings', parkings)

// Default route
app.all('*', (req, res) => {res.redirect('/') })

// 404 error handler
app.use((req, res) => {
    res.status(404)
    res.json({ error: 'Not found' })
})

export default app