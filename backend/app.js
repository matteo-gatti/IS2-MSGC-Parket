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

import winston from 'winston'
import expressWinston from 'express-winston'

const app = express()

app.use(express.json({ limit: '100mb' }))
app.use(cookieParser())
app.use(cors())

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  ignoreRoute: function (req, res) { return req.url.split("/")[1] !== "api"; },
  meta: false,
  msg: "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}",
  expressFormat: true,
  colorize: true,
  statusLevels: false,
  level: function (req, res) {
    var level = "";
    if (res.statusCode >= 100) { level = "info"; }
    if (res.statusCode >= 400) { level = "warn"; }
    if (res.statusCode >= 500) { level = "error"; }
    return level;
  }
}));


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

app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  )
}));

// Error handling
app.all('/api/*', (req, res) => {
  res.status(404)
  res.json({ message: 'Not found' })
})

// Serve static files
app.use('/', statics)

export default app