const mongoose = require('mongoose')

const schema = mongoose.Schema({
  uid: { type: String, unique: true },
  employmentStatus: String,
  refPerson1: {
    name: String,
    phoneNumber: String,
  },
  refPerson2: {
    name: String,
    phoneNumber: String,
  },
  bankStatement: Object,
  payslips: Object,
  buisnessProof: Object,
  panCard: {
    front: Object,
    back: Object,
  },
  aadharCard: {
    front: Object,
    back: Object,
  },
  addressProof: [{ type: Object }],
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'submited'],
    default: 'pending',
  },
})

module.exports = mongoose.model('Kyc', schema)
