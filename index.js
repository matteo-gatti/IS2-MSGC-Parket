import app from './backend/app.js'
import config from './config.js'
import path from 'path';
import mongoose from 'mongoose'

const environment = process.env.NODE_ENV 
const stage = config[environment]


app.locals.db = mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to DB 💪')

        // Start the server
        app.listen(stage.port, () => {
            console.log(`👂 Server listening on port ${stage.port}`)
        })
    })
    .catch(err => {
        console.log(err)
    });
/* process.on('SIGINT', function() {
    console.log('Quitting and closing DB connection');
    app.locals.db.close()
    process.exit()
}); */

// Close the connection when the application stops

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, () => {
    mongoose.connection.close(() => {
        console.log('\nMongoose connection closed through app termination 📕');
        process.exit(0);
    })
}));