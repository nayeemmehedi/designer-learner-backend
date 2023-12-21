const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    name: String,
    promotionType: {
      type: String,
      enum: ['sale', 'coupon'],
    },
    couponCode: {
      type: String,
    },
    courses: [
      {
        type: String,
        ref: 'Course',
      },
    ],
    discountType: {
      type: String,
      enum: ['percentage', 'amount'],
    },
    discount: Number,
    maxTransactions: Number,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

const Promotion = mongoose.model('Promotion', schema)

module.exports = Promotion
