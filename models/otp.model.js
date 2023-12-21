const mongoose = require('mongoose')

const schema = mongoose.Schema(
  {
    otp: String,
    otpExpiry: Date,
    verified: {
      type: Boolean,
      default: false
    },
    sentTo: String
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
  }
)

const Otp = mongoose.model('Otp', schema)

module.exports = Otp