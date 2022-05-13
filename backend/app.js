import express from 'express'

import { users } from './users.js'

const app = express()

app.use(express.json())

app.use('/', express.static('static')) //serves front-end static files?

app.use('/api/v1/users', users)

app.all('*', (req, res) => {res.redirect('/') })

/* Default 404 handler */
app.use((req, res) => {
    res.status(404)
    res.json({ error: 'Not found' })
})

export { app as app }