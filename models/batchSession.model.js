const mongoose = require('mongoose')

// const assignmentQuestionSchema = new mongoose.Schema({
//   assignmentTitle: String,
//   assignmentInstructions: String,
// })
const BatchsessionSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      ref: 'Course',
    },
    curriculum: {
      type: String,
      ref: 'Curriculum',
    },
    session: {
      type: String,
      ref: 'Session',
    },
    batch: {
      type: String,
      ref: 'Batch',
    },
    mentorStatus: {
      type: String,
      enum: ['pending-review', 'overdue', 'approved'],
      default: 'pending-review',
    },
    furniturePics: [Object],
    stationaryPics: [Object],
    bookingConfirmation: [Object],
    secondayMentorIds: [String],
    sessionRecordings: [Object],
    photos: [Object],
    // sessionType: String,
    // sessionName: String,
    // sessionIcon: Object,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
    // discriminatorKey: 'sessionType',
  },
)

// const onboardingSchema = new mongoose.Schema({
//   link: {
//     linkName: String,
//     linkDescription: String,
//     linkButtonName: String,
//     linkUrl: String,
//   },
//   problemBriefs: [
//     {
//       type: String,
//       ref: 'ProblemBrief',
//     },
//   ],
//   problemBriefsNumber: Number,
//   softwaresToInstall: [{
//     software: String,
//     url: String,
//   }],
//   figma: {
//     figmaUrl: String,
//     figmaDocument: Object,
//   },
//   XD: {
//     XDUrl: String,
//     XDDocument: Object,
//   },
//   learnerAgreement: {
//     title: String,
//     linkDescription: String,
//     linkUrl: String,
//   },
// })

// const normalSchema = new mongoose.Schema({
//   studyMaterial: [
//     {
//       studyMaterialTitle: String,
//       studyMaterialType: {
//         type: String,
//         enum: ['figma', 'video', 'file'],
//       },
//       figmaCode: String,
//       outline: [
//         {
//           topicName: String,
//           slideNumber: Number,
//         },
//       ],
//       videoUrl: String,
//       document: Object,
//     },
//   ],
//   mentorGuidelines: {
//     guidelineType: {
//       type: String,
//       enum: ['figma', 'video', 'file'],
//     },
//     outline: [
//       {
//         topicName: String,
//         pageNumber: Number,
//       },
//     ],
//   },
//   resources: [String],
//   assignments: [{ type: assignmentQuestionSchema }],
// })

// const evaluationSchema = new mongoose.Schema({
//   studyMaterial: [
//     {
//       studyMaterialType: {
//         type: String,
//         enum: ['figma', 'video', 'file'],
//       },
//       figmaCode: String,
//       outline: [
//         {
//           topicName: String,
//           slideNumber: Number,
//         },
//       ],
//       videoUrl: String,
//       document: Object,
//     },
//   ],
//   resources: [String],
//   assignments: [{ type: assignmentQuestionSchema }],
//   activityFile: {
//     fileUrl: String,
//     document: Object,
//   },
//   evaluation: {
//     maxMarks: Number,
//     parameters: [
//       {
//         parameterName: String,
//         readerExplanation: String,
//         mentorGuidelines: String,
//       },
//     ],
//   },
// })

const BatchSession = mongoose.model('BatchSession', BatchsessionSchema)
// const OnboardingSession = BatchSession.discriminator(
//   'BatchOnboarding',
//   onboardingSchema,
// )
// const NormalSession = BatchSession.discriminator('BatchNormal', normalSchema)
// const EvaluationSession = BatchSession.discriminator(
//   'BatchEvaluation',
//   evaluationSchema,
// )

// module.exports = {
//   BatchSession,
//   OnboardingSession,
//   NormalSession,
//   EvaluationSession,
// }

module.exports = BatchSession
