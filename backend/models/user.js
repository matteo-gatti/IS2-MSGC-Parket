import mongoose from 'mongoose'
var Schema = mongoose.Schema

const userSchema = new Schema({
    self: {
        type: "String",
        trim: true,
    },
    username: {
        type: 'String',
        required: true,
        trim: true,
        unique: true,
        immutable: true
    },
    password: {
        type: 'String',
        required: true,
        trim: true,
    },
    name: {
        type: 'String',
        required: true,
        trim: true,
    },
    surname: {
        type: 'String',
        required: true,
        trim: true,
    },
    email: {
        type: 'String',
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    parkings: [{
        type: Schema.Types.ObjectId,
        ref: 'Parking',
    }],
})

export default mongoose.model('User', userSchema)
