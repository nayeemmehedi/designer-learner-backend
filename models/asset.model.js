const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    assetType: {
      type: String,
      enum: ['image', 'video', 'icon', 'gif', 'document'],
      required: true,
    },
    name: String,
    file: {
      type: Object,
      required: true,
    },
    fileExtension: String,
    alternateText: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

schema.index({ name: 'text' })

const Asset = mongoose.model('Asset', schema)

module.exports = Asset
