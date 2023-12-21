const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    title: String,
    modifierId: String,
    pageUrl: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive'
    },
    pageType: {
      type: String,
      enum: ['static', 'dynamic'],
      default: 'static'
    },
    navigation: {
      type: String,
      enum: ['header', 'footer'],
    },
    adminPortfolios: [{
      type: String,
      ref: 'adminPortfolio',
    }],
    navigationCategory: String,
    navigationPosition: Number,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

schema.virtual('modifiedBy', {
  ref: 'User',
  localField: 'modifierId',
  foreignField: 'uid',
  justOne: true
})

const Page = mongoose.model('Page', schema)

module.exports = Page