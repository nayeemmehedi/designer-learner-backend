const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
    },
    defaultRole: {
      type: String,
      enum: ['admin', 'learner', 'mentor'],
    },
    fullName: String,
    dateOfBirth: String,
    email: String,
    phone: String,
    phoneOnPortfolio: {
      type: Boolean,
      default: false,
    },
    roles: [
      {
        type: String,
        ref: 'Role',
      },
    ],
    permissions: {
      type: String,
      ref: 'UserPermission',
    },
    whatsappNumber: String,
    emergencyContactNumber: String,
    gst: {
      companyName: String,
      gstNumber: Number,
    },
    billingAddress: {
      houseNumber: String,
      streetName: String,
      area: String,
      landmark: String,
      zipCode: String,
      city: String,
      state: String,
    },
    shippingAddress: {
      houseNumber: String,
      streetName: String,
      area: String,
      landmark: String,
      zipCode: String,
      city: String,
      state: String,
    },
    additionalAddress: {
      houseNumber: String,
      streetName: String,
      area: String,
      landmark: String,
      zipCode: String,
      city: String,
      state: String,
    },
    notifications: [
      {
        type: String,
        enum: ['email', 'sms', 'website'],
      },
    ],
    profilePicture: Object,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    creatorId: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
)

schema.virtual('createdBy', {
  ref: 'User',
  localField: 'creatorId',
  foreignField: 'uid',
  justOne: true,
})

const User = mongoose.model('User', schema)

module.exports = User
