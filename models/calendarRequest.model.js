const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    mentorId: String,
    start: Date,
    end: Date,
    startTime: Number,
    endTime: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reason: String,
    adminReason: String,
    calendar: {
      type: String,
      ref: 'Calendar',
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
)
schema.virtual('mentor', {
  ref: 'User',
  localField: 'mentorId',
  foreignField: 'uid',
  justOne: true,
})

const CalendarRequest = mongoose.model('CalendarRequest', schema)

module.exports = CalendarRequest
