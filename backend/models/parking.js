import mongoose from 'mongoose'
import mongoose_fuzzy_searching from "@imranbarbhuiya/mongoose-fuzzy-searching"
var Schema = mongoose.Schema

const parkingSchema = new Schema({
    self: {
        type: 'String',
        trim: 'true'
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
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
        trim: true,
    },
    latitude: {
        type: 'Number',
        trim: true,
    },
    longitude: {
        type: 'Number',
        trim: true,
    },
    visible: {
        type: 'Boolean',
        default: true
    },
    insertions: [{
        type: Schema.Types.ObjectId,
        ref: 'Insertion',
    }],
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review',
    }]
})

parkingSchema.plugin(mongoose_fuzzy_searching.default, {
    fields: [{
          name: 'name',
          weight: 3,
        },
        {
          name: 'city',
          weight: 1,
        }]
  });

export default mongoose.model('Parking', parkingSchema)