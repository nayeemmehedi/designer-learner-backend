const mongoose = require('mongoose')

const mentorProfileSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
  },
  ExperienceTittle: String,
  ExperienceContext: String,
  bankName: String,
  bankState: String,
  bankCity: String,
  bankAddress: String,
  ifscCode: String,
  accNo: String,
  upiId: String,
  kyc: { type: String, ref: 'Kyc' },
  mentorAgreement: [Object],
  status: {
    type: String,
    enum: ['allocated', 'unallocated', 'available', 'paused'],
    default: 'unallocated',
  },
  invitationStatus: {
    type: String,
    enum: ['invited', 'accepted', 'declined', 'not-invited'],
    default: 'not-invited',
  },
  availablilty: {
    days: [String],
    from: Date,
    to: Date,
  },
  dateOfBirth: Date,
  TShirtSize: String,
  mouStartDate: Date,
  mouEndDate: Date,
  remuneration: Number,
  courseEligibilty: [{ type: String, ref: 'Course' }],
})

mentorProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'uid',
  foreignField: 'uid',
  justOne: true,
})

module.exports = mongoose.model('MentorProfile', mentorProfileSchema)
