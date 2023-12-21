const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: ['Course', 'Meetup'],
    },
    batch: {
      type: String,
      ref: 'Batch',
    },
    location: {
      type: String,
      ref: 'Location',
    },
    amount: Number,
    productId: String,
    paymentMode: {
      type: String,
      enum: [
        'creditCardEMI',
        'oneShot',
        'neevFinance',
        'creditCard',
        'debitCard',
      ],
    },
    paymentMethod: String,
    transactionId: String,
    orderId: String,
    razorpay_payment_id: String,
    madeById: String,
    status: {
      type: String,
      // rpending is razorPay pending which means the razorpay flow was initiated and not yet finished
      enum: ['pending', 'successful', 'failed', 'rpending'],
      default: 'pending',
    },
    employmentStatus: {
      type: String,
      enum: ['employed', 'unemployed', 'selfEmployed'],
    },
    parentDetails: {
      name: String,
      phone: String,
      employmentStatus: {
        type: String,
        enum: ['employed', 'unemployed', 'selfEmployed'],
      },
    },
    bankStatement: Object,
    payslips: Object,
    buisnessProof: Object,
    panCard: {
      front: Object,
      back: Object,
    },
    adhaarCard: {
      front: Object,
      back: Object,
    },
    addressProof: Object,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

schema.virtual('madeBy', {
  ref: 'User',
  localField: 'madeById',
  foreignField: 'uid',
  justOne: true,
})

schema.virtual('product', {
  refPath: 'transactionType',
  localField: 'productId',
  foreignField: '_id',
  justOne: true,
})

const Transaction = mongoose.model('Transaction', schema)

module.exports = Transaction
