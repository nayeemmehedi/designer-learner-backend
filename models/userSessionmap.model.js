const mongoose = require('mongoose')

const userSessionMap = new mongoose.Schema(
  {
    userId: String,
    batch: {
      type: String,
      ref: 'Batch',
    },
    curriculum: {
      type: String,
      ref: 'Curriculum',
    },
    course: {
      type: String,
      ref: 'Course',
    },
    session: {
      type: String,
      ref: 'Session',
    },
    sessionType: String,
    problemBriefs: [
      {
        type: String,
        ref: 'ProblemBrief',
      },
    ],
    agreement: {
      reason: String,
      codeOfConduct: Boolean,
    },
    attendance: Boolean,
    status: {
      type: String,
      enum: ['completed', 'incomplete'],
      default: 'incomplete',
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
)

userSessionMap.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'uid',
  justOne: true,
})
module.exports = mongoose.model('UserSessionMap', userSessionMap)

/* 
user flow
signup/login
buy a course
pay
choose a case study
attent session
so assignments on session
make portfolio
apply for jobs
*/
