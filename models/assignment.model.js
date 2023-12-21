const mongoose = require('mongoose')

const AssignmentSchema = new mongoose.Schema(
  {
    uid: String,
    assignment: String,
    batch: {
      type: String,
      ref: 'Batch',
    },
    session: {
      type: String,
      ref: 'Session',
    },
    canvas: Object,
    figmaActivityFile: Object,
    prototypeLink: String,
    iteration: Number,
    timeTaken: Number,
    status: {
      type: String,
      enum: ['submitted', 'approved', 'rework', 'rejected', 'not-submitted'],
      default: 'submitted',
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
)
AssignmentSchema.virtual('user', {
  ref: 'User',
  localField: 'uid',
  foreignField: 'uid',
  justOne: true,
})
module.exports = mongoose.model('Assignment', AssignmentSchema)
