const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true,
    },
    admin: {
      adminUsersAndRoles: {
        view: [{
          type: String,
          enum: ['unenrolledUsers']
        }],
        edit: [{
          type: String,
          enum: [
            'newUsersAndRoles', 
            'userAndRoleDetails'
          ]
        }],
        delete: [{
          type: String,
          enum: [
            'Users', 
            'Roles'
          ]
        }],
      },
      learnersAndMentors:{
        view: [{
          type: String,
          enum: [
            'listEnrolledLearners', 
            'listMentors', 
            'learnerDetails', 
            'mentorDetails'
          ]
        }],
        edit: [{
          type: String,
          enum: [
            'reAllocateLearnerBatch', 
            'mentorDetails'
          ]
        }],
        delete: [{
          type: String,
          enum: [
            'markMentorsInactive', 
            'deboardLearnerFromBatch'
          ]
        }],
      },
      batchManagement: {
        view: [{
          type: String,
          enum: [
            'allBatches', 
            'mentorAndLearnerAttendance', 
            'feedback', 
            'submissionStatus', 
            'photos', 
            'sessionRecordings', 
            'unassignedBatches'
          ]
        }],
        edit: [{
          type: String,
          enum: [
            'planNewBatch', 
            'batchSchedule', 
            'batchMentor', 
            'batchRoom', 
            'coordinators', 
            'problemBriefs', 
            'sessionRecordings', 
            'rescheduleSession',
            'photos',
          ]
        }],
        delete: [{
          type: String,
          enum: [
            'pauseBatch', 
            'cancelBatch', 
            'sessionRecordings'
          ]
        }],
      },
      courseManagement: {
        view: [{
          type: String,
          enum: [
            'allCourses', 
            'courseDetails', 
            'curriculumAndSessions'
          ]
        }],
        edit: [{
          type: String,
          enum: [
            'newCourse', 
            'courses', 
            'activateCourses', 
            'curriculums', 
            'activateCurriculums', 
            'coursePageDetails', 
            'webpageSettings'
          ]
        }],
        delete: [{
          type: String,
          enum: [
            'deactivateCurriculum', 
            'deactivateCourse'
          ]
        }],
      },
      mentorshipManagement: {
        view: [{
          type: String,
          enum: ['feedback']
        }],
        edit: [{
          type: String,
          enum: [
            'sendMentorshipInvites', 
            'batchMentors',
            'feedback', 
            'mentorDetails'
          ]
        }],
        delete: [{
          type: String,
          enum: [
            'deactivateMentor', 
            'mentorDormant'
          ]
        }],
      },
      problemBriefManagement: {
        view: [{
          type: String,
          enum: [
            'allProblemBriefs', 
            'problemBriefDetails'
          ]
        }],
        edit: [{
          type: String,
          enum: [
            'problemBriefs', 
            'activateProblemBrief'
          ]
        }],
        delete: [{
          type: String,
          enum: ['deactivateProblemBrief']
        }],
      },
      jobPostsManagement: {
        view: [{
          type: String,
          enum: [
            'allJobPosts', 
            'jobPostDetails'
          ]
        }],
        edit: [{
          type: String,
          enum: [
            'postJobApplication', 
            'downloadApplicationDetails', 
            'learnerApplicationStatus'
          ]
        }],
        delete: [{
          type: String,
          enum: ['closeJobPost']
        }],
      },
      locationManagement: {
        view: [{
          type: String,
          enum: [
            'allLocations', 
            'locationDetails', 
            'locationCalendar'
          ]
        }],
        edit: [{
          type: String,
          enum: [
            'addLocation', 
            'locationDetails', 
            'locationWebpageDetails'
          ]
        }],
        delete: [{
          type: String,
          enum: ['deactivateLocation']
        }],
      },
      blogManagement: {
        view: [{
          type: String,
          enum: ['allBlogs']
        }],
        edit: [{
          type: String,
          enum: [
            'addBlog', 
            'blogWebpageDetails'
          ]
        }],
        delete: [{
          type: String,
          enum: ['deactivateBlog']
        }],
      },
      portfolioManagement: {
        view: [{
          type: String,
          enum: ['allCaseStudies']
        }],
        edit: [{
          type: String,
          enum: [
            'addCaseStudiesToPortfolio', 
            'portfolioWebpageDetails'
          ]
        }],
        delete: [{
          type: String,
          enum: ['caseStudiesFromPortfolio']
        }],
      }
    },
    mentor: {
      mentorDashboard: {
        view: [{
          type: String,
          enum: ['mentorDashboard']
        }],
        interact: [{
          type: String,
          enum: ['openFeedback']
        }],
        delete: [{
          type: String,
          enum: ['']
        }],
      },
      mentorsPortfolio: {
        view: [{
          type: String,
          enum: [
            'portfolio', 
            'availabilityAndCalendar', 
            'mentorAgreement'
          ]
        }],
        interact: [{
          type: String,
          enum: [
            'uploadLinkedinResume', 
            'addAvailability', 
            'editPortfolio', 
            'addBankAccountDetails', 
            'uploadAgreementImages'
          ]
        }],
        delete: [{
          type: String,
          enum: ['']
        }],
      },
      mentorCourseDetails: {
        view: [{
          type: String,
          enum: [
            'sessionList', 
            'studyMaterial', 
            'mentorGuidelines', 
            'Assignment', 
            'sessionDetails'
          ]
        }],
        interact: [{
          type: String,
          enum: [
            'approveAssignment', 
            'sendForRework', 
            'addCommentsAndReply', 
            'usePencil', 
            'zoomInOut', 
            'NavigateBetweenAssignments', 
            'downloadAssignment', 
            'openPrototype'
          ]
        }],
        delete: [{
          type: String,
          enum: ['']
        }],
      }
    },
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

const UserPermission = mongoose.model('UserPermission', schema)

module.exports = UserPermission