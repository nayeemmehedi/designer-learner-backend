const mongoose = require('mongoose')

const assignmentQuestionSchema = new mongoose.Schema({
  assignmentTitle: String,
  assignmentInstructions: String,
})
const sessionSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      ref: 'Course',
    },
    curriculum: {
      type: String,
      ref: 'Curriculum',
    },
    sessionType: String,
    sessionName: String,
    sessionIcon: Object,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
    discriminatorKey: 'sessionType',
  },
)

const onboardingSchema = new mongoose.Schema({
  link: {
    linkName: String,
    linkDescription: String,
    linkButtonName: String,
    linkUrl: String,
  },
  problemBriefs: [
    {
      type: String,
      ref: 'ProblemBrief',
    },
  ],
  problemBriefsNumber: Number,
  softwaresToInstall: [{
    software: String,
    url: String,
  }],
  figma: {
    figmaUrl: String,
    figmaDocument: Object,
  },
  XD: {
    XDUrl: String,
    XDDocument: Object,
  },
  learnerAgreement: {
    title: String,
    linkDescription: String,
    linkUrl: String,
  },
})

const normalSchema = new mongoose.Schema({
  studyMaterial: [
    {
      studyMaterialTitle: String,
      studyMaterialType: {
        type: String,
        enum: ['figma', 'video', 'file'],
      },
      figmaCode: String,
      outline: [
        {
          topicName: String,
          slideNumber: Number,
        },
      ],
      videoUrl: String,
      document: Object,
    },
  ],
  mentorGuidelines: {
    guidelineType: {
      type: String,
      enum: ['figma', 'video', 'file'],
    },
    outline: [
      {
        topicName: String,
        pageNumber: Number,
      },
    ],
  },
  resources: [String],
  assignments: [{ type: assignmentQuestionSchema }],
})

const evaluationSchema = new mongoose.Schema({
  studyMaterial: [
    {
      studyMaterialType: {
        type: String,
        enum: ['figma', 'video', 'file'],
      },
      figmaCode: String,
      outline: [
        {
          topicName: String,
          slideNumber: Number,
        },
      ],
      videoUrl: String,
      document: Object,
    },
  ],
  resources: [String],
  assignments: [{ type: assignmentQuestionSchema }],

  activityFile: {
    fileUrl: String,
    document: Object,
  },
  evaluation: {
    maxMarks: Number,
    parameters: [
      {
        parameterName: String,
        readerExplanation: String,
        mentorGuidelines: String,
      },
    ],
  },
  certificateTemplate: Object,
})

const Session = mongoose.model('Session', sessionSchema)
const OnboardingSession = Session.discriminator('Onboarding', onboardingSchema)
const NormalSession = Session.discriminator('Normal', normalSchema)
const EvaluationSession = Session.discriminator('Evaluation', evaluationSchema)

module.exports = {
  Session,
  OnboardingSession,
  NormalSession,
  EvaluationSession,
}
