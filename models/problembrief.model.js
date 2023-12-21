const mongoose = require('mongoose')

const problemBriefSchema = new mongoose.Schema(
  {
    title: String,
    courses: [{ type: String, ref: 'Course' }],
    domain: String,
    competitors: [String],
    thumbnail: Object,
    statement: String,
    objectives: String,
    potentialTarget: String,
    typeOfDevice: String,
    feauture: [{ name: String, useCase: [{ type: String }] }],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
  },
  {
    timestamps: true,
  },
)

const probBriefModel = mongoose.model('ProblemBrief', problemBriefSchema)
module.exports = probBriefModel
