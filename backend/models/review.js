import mongoose from 'mongoose'
var Schema = mongoose.Schema

const reviewSchema = new Schema({
    /* self: {
        type: 'String',
        trim: 'true'
    }, */
    title: {
        type: 'String',
        trim: true,
        required: true
    },
    parking: {
        type: Schema.Types.ObjectId,
        ref: 'Parking'
    },
    stars: {
        type: 'Number',
        required: true
    },
    description: {
        type: 'String',
        required: true
    },
    writer: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    datetime: {
        type: 'Date',
        required: true
    },
    reservation: {
        type: Schema.Types.ObjectId,
        ref: 'Reservation',
        required: true
    }
})

export default mongoose.model('Review', reviewSchema)