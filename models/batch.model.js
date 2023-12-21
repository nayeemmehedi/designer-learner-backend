const mongoose = require('mongoose')

const batchSchema = new mongoose.Schema(
  {
    batchCode: String,
    courseId: {
      type: String,
      ref: 'Course',
    },
    curriculumId: {
      type: String,
      ref: 'Curriculum',
    },
    operationCoId: String,
    hrCoId: String,
    productCoId: String,
    primaryMentorId: String,
    status: {
      type: String,
      enum: ['completed', 'not-scheduled', 'scheduled', 'live', 'cancelled', 'paused'],
      default: 'not-scheduled',
    },
    startDate: Date,
    endDate: Date,
    startTime: Date,
    endTime: Date,
    repeatEvery: {
      type: String,
      enum: ['week', 'month'],
    },
    repeatDays: [String],
    problemBriefs: [{ type: String, ref: 'ProblemBrief' }],
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
)

batchSchema.virtual('operationCo', {
  ref: 'User',
  localField: 'operationCoId',
  foreignField: 'uid',
  justOne: true,
})
batchSchema.virtual('hrCo', {
  ref: 'User',
  localField: 'hrCoId',
  foreignField: 'uid',
  justOne: true,
})
batchSchema.virtual('productCo', {
  ref: 'User',
  localField: 'productCoId',
  foreignField: 'uid',
  justOne: true,
})

batchSchema.virtual('primaryMentor', {
  ref: 'User',
  localField: 'primaryMentorId',
  foreignField: 'uid',
  justOne: true,
})

module.exports = mongoose.model('Batch', batchSchema)
