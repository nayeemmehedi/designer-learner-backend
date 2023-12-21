const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    file: Object,
    userId: String,
    pages: [
      {
        type: String,
        ref: 'Page',
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

schema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'uid',
  justOne: true
})

const Testimonial = mongoose.model('Testimonial', schema)

module.exports = Testimonial