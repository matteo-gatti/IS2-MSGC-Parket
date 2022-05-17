import mongoose from 'mongoose'
var Schema = mongoose.Schema

const insertionSchema = new Schema({
    self: {
        type: 'String',
        trim: 'true'
    },
    name: {
        type: 'String',
        trim: true,
        required: true
    },
    reservations: [{
        type: Schema.Types.ObjectId,
        ref: 'Reservation',
    }],
    parking: {
        type: Schema.Types.ObjectId,
        ref: "Parking"
    }
})

export default mongoose.model('Insertion', insertionSchema)