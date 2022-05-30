import mongoose from 'mongoose'
var Schema = mongoose.Schema

const reviewSchema = new Schema({
    self: {
        type: 'String',
        trim: 'true'
    },
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
        default: 5
    },
    description: {
        type: 'String',
        default: false,
    },
    writer:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    datetime: {
        type: 'Date',
        required: true
    },
})

export default mongoose.model('Review', reviewSchema)