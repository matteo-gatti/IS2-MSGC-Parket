import mongoose from 'mongoose'
var Schema = mongoose.Schema

const recurrenceSchema = new Schema({
    daysOfTheWeek: [
        {
            type: 'String',
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            required: true
        }
    ],
    timeStart: {
        type: 'Date',
        required: true
    },
    timeEnd: {
        type: 'Date',
        required: true
    }
})

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
    datetimeStart: {
        type: 'Date',
        required: true
    },
    datetimeEnd: {
        type: 'Date',
        required: true
    },
    reservations: [{
        type: Schema.Types.ObjectId,
        ref: 'Reservation',
    }],
    parking: {
        type: Schema.Types.ObjectId,
        ref: 'Parking'
    },
    priceHourly: {
        type: 'Number',
        required: true,
    },
    priceDaily: {
        type: 'Number',
    },
    minInterval: {
        type: 'Number',
        default: 10
    },
    recurrent: {
        type: 'Boolean',
        default: false,
    },
    recurrenceData: {
        type: recurrenceSchema,
        required: function() {return this.recurrent}
    }
})

export default mongoose.model('Insertion', insertionSchema)