const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    imageCarousel: [{
      image: Object,
      caption: String,
    }],
    courseName: String,
    courseCode: String,
    basePrice: Number,
    courseDuration: String,
    sessionCount: Number,
    typeOfConduct: String,
    skillLevels: String,
    effortInHours: String,
    courseThumbnail: Object,
    overviewLocation: [{
      type: String,
      ref: 'Location'
    }],
    benefits: {
      title: String,
      description: String,
      cards: [{
        icon: Object,
        heading: String,
        body: String,
      }]
    },
    highlights: [
      {
        metricNumber: String,
        metricLabel: String 
      }
    ],
    courseOutcomes: {
      title: String,
      description: String,
      cards: [{
        icon: Object,
        heading: String,
        body: String,
      }]
    },
    plans: [String],
    modules: [
      {
        moduleIcon: Object,
        moduleName: String,
        sessions: String,
        topics: [String],
      }
    ],
    eligibility: {
      title: String,
      description: String,
      cards: [{
        icon: Object,
        heading: String,
        body: String,
      }]
    },
    careerPro: {
      title: String,
      description: String,
      cards: [{
        icon: Object,
        heading: String,
        body: String,
      }]
    },
    mentorsId: [String],
    testimonials: [Object],
    tagline: String,
    status: {
      type: String,
      default: 'inactive',
      enum: ['active', 'inactive']
    },
    faq: [{
      title: String,
      description: String,
    }],
    URL: String,
    modifierId: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
  }
)

schema.virtual('mentors', {
  ref: 'User',
  localField: 'mentorsId',
  foreignField: 'uid',
})

schema.virtual('modifiedBy', {
  ref: 'User',
  localField: 'modifierId',
  foreignField: 'uid',
  justOne: true
})

const Course = mongoose.model('Course', schema)

module.exports = Course