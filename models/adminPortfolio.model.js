const mongoose = require('mongoose')

const adminPortfolioSchema = new mongoose.Schema(
  {
    caseStudy: {
      type: String,
      ref: 'caseStudies',
    },
    problemBrief: {
      type: String,
      ref: 'ProblemBrief',
    },
    field: [String],
    industry: [String],
    courseTags: [String],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    addedById: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

adminPortfolioSchema.virtual('addedBy', {
  ref: 'User',
  localField: 'addedById',
  foreignField: 'uid',
  justOne: true,
})

module.exports = mongoose.model('adminPortfolio', adminPortfolioSchema)
