const mongoose = require('mongoose')

const portfolioSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
    },
    email: String,
    phone: String,
    Location: String,
    socialMedia: {
      linkedIn: String,
      twitter: String,
      facebook: String,
      instagram: String,
    },
    about: {
      heading: String,
      body: String,
    },
    skills: [String],
    tools: [String],
    education: [
      {
        institute: String,
        fieldOfStudy: String,
        domain: String,
        degree: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    certification: [
      {
        institute: String,
        fieldOfStudy: String,
        domain: String,
        course: String,
        startDate: String,
        endDate: String,
      },
    ],
    workExperience: [
      {
        designation: String,
        companyName: String,
        domain: String,
        annualCTC: String,
        startDate: String,
        endDate: String,
        description: String,
        currentlyWorking: Boolean,
      },
    ],
    typeOfWork: [String],
    industry: [String],
    caseStudies: [
      {
        type: String,
        ref: 'caseStudies',
      },
    ],
    employmentStatus: {
      type: String,
      enum: ['employed', 'unemployed', 'selfEmployed'],
    },
    parentDetails: {
      name: String,
      phone: String,
      employmentStatus: {
        type: String,
        enum: ['employed', 'unemployed', 'selfEmployed'],
      },
    },
    mediumUsername: String,
    kyc: {
      type: String,
      ref: 'Kyc',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

portfolioSchema.virtual('user', {
  ref: 'User',
  localField: 'uid',
  foreignField: 'uid',
  justOne: true,
})

module.exports = mongoose.model('Portfolio', portfolioSchema)
