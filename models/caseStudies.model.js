const mongoose = require('mongoose')

const caseStudiesSchema = new mongoose.Schema(
  {
    uid: String,
    problemBriefId: String,
    tittle: String,
    thumbnail: Object,
    file: Object,
    fileType: String,
    status: String,
    tags: [{ type: String }],
    caseStudyType: {
      type: String,
      enum: ['medium', 'dribble', 'behance', 'other']
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

caseStudiesSchema.virtual('learner', {
  ref: 'User',
  localField: 'uid',
  foreignField: 'uid',
  justOne: true
})


const CaseStudiesModel = mongoose.model('caseStudies', caseStudiesSchema)

module.exports = CaseStudiesModel
