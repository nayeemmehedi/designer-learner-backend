const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    course: {
      type: String,
      ref: 'Course',
      required: true
    },
    version: Number,
    sessionDuration: Number,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive'
    },
    modifierId: String,
  }, 
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
  }
)

schema.virtual('modifiedBy', {
  ref: 'User',
  localField: 'modifierId',
  foreignField: 'uid',
  justOne: true
})

const Curriculum = mongoose.model('Curriculum', schema)

module.exports = Curriculum