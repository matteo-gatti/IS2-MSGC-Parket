import mongoose from 'mongoose'
var Schema = mongoose.Schema

const reservationSchema = new Schema({
    self: {
        type: 'String',
        trim: 'true'
    },
    client: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    insertion: {
        type: Schema.Types.ObjectId,
        ref: 'Insertion',
    },
    datetimeStart: {
        type: 'Date',
        required: true
    },
    datetimeEnd: {
        type: 'Date',
        required: true
    },
    price: {
        type: 'Number',
        required: true,
    },
    reviewed: {
        type: 'Boolean',
        default: false
    }
})

export default mongoose.model('Reservation', reservationSchema)