import mongoose from 'mongoose'
var Schema = mongoose.Schema

const parkingSchema = new Schema({
    owner: {
        type: 'String',
        trim: true,
        immutable: true,
    },
    name: {
        type: 'String',
        required: true,
        trim: true,
    },
    address: {
        type: 'String',
        required: true,
        trim: true,
    },
    city: {
        type: 'String',
        required: true,
        trim: true,
    },
    country: {
        type: 'String',
        required: true,
        trim: true,
    },
    description: {
        type: 'String',
        required: true,
        trim: true,
    },
    image: {
        type: 'String',
        required: true,
        trim: true,
    },
    latitud: {
        type: 'Number',
        trim: true,
    },
    longitud: {
        type: 'Number',
        trim: true,
    },
})

export default mongoose.model('Parking', parkingSchema)