const mongoose = require('mongoose')

const landmarksAndRoutesSchema = new mongoose.Schema({
  landmark: String,
  route: String,
})
const addressSchema = new mongoose.Schema({
  pinCode: String,
  state: String,
  city: String,
  fullAddress: String,
  Landmark: String,
})

const navigationSchema = new mongoose.Schema({
  googleMapUrl: String,
  byBus: String,
  nextTo: String,
  nearBy: String,
  landmarksAndRoutes: [landmarksAndRoutesSchema],
})

const locationSchema = new mongoose.Schema(
  {
    locationCode: String,
    locationName: String,
    address: {
      type: addressSchema,
      _id: false,
    },
    navigation: {
      type: navigationSchema,
      _id: false,
    },
    locationImg: Object,
    outsideImg: Object,
    commonAreaImg: Object,
    activityImg: Object,
    interviewImg: Object,
    ongoingSessionImg: Object,
    normanRoomImg: Object,
    dieterRoom: Object,
    pointers: {
      pointersHeading: String,
      pointersImage: Object,
      points: [
        {
          icon: Object,
          point: String,
        },
      ],
    },
    batchBenefits: {
      heading: String,
      points: [
        {
          icon: Object,
          point: String,
        },
      ],
    },
    status: {
      type: String,
      default: 'inactive',
      enum: ['active', 'inactive'],
    },
    URL: String,
    modifierId: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
)

locationSchema.virtual('modifiedBy', {
  ref: 'User',
  localField: 'modifierId',
  foreignField: 'uid',
  justOne: true,
})

module.exports = mongoose.model('Location', locationSchema)
