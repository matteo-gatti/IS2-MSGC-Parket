import { app } from './backend/app.js'
import { config } from './config.js'

const environment = process.env.NODE_ENV
const stage = config[environment]

// Start the server
app.listen(/*`${stage.port}`*/5000, () => {
    console.log(`Server listening on port x`)
});