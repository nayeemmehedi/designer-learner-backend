const batchSessionModel = require('../models/batchSession.model')
const batchModel = require('../models/batch.model')
const assignmentModel = require('../models/assignment.model')
const userSessionModel = require('../models/userSessionmap.model')
const calendarModel = require('../models/calendar.model')
const sessionModel = require('../models/session.model').Session
const GlobalSettingModel = require('../models/globalsettings.model')
const preSigner = require('../utils/urlGenerator.util')

const isOverDue = require('../utils/deadline.util').isOverDue
const GetCoursesDetials = async (req, res) => {
  try {
    const id = req.uid
    let courses = []
    const batches = await batchModel
      .find({ primaryMentorId: id }, ['startDate', 'endDate', 'batchCode'])
      .populate('courseId', ['courseName', 'courseThumbnail'])
    for (let batch of batches) {
      let tempBatch = batch.toJSON()
      if (tempBatch?.courseId?.courseThumbnail) {
        tempBatch.courseId.courseThumbnail = await preSigner(
          tempBatch.courseId,
          'courseThumbnail',
        )
      }
      tempBatch.users = []
      let assignments = {}
      assignments.notReviewed = 0
      assignments.approvedAssignments = 0
      assignments.IterateAssignments = 0
      assignments.overdue = 0
      assignments.reviewed = 0
      assignments.notSubmited = 0
      let users = await userSessionModel
        .find({ batch: batch._id }, ['userId'])
        .limit(3)
        .populate('user', ['fullName', 'profilePicture'])
      for (let userObj of users) {
        let { user } = userObj
        if (user?.profilePicture && typeof user.profilePicture == 'string') {
          user.profilePicture = await preSigner(user, 'profilePicture')
        }

        tempBatch.users.push(user)
      }
      let session = {}
      session.total = await batchSessionModel
        .find({ batch: batch._id })
        .countDocuments()
      session.upcoming = await calendarModel
        .find({
          eventId: batch._id,
          status: 'scheduled',
        })
        .countDocuments()
      session.completed = await calendarModel
        .find({
          eventId: batch._id,
          status: 'completed',
        })
        .countDocuments()
      let batchSession = await batchSessionModel
        .find({ batch: batch._id })
        .populate('session')
      for (let bs of batchSession) {
        const userCount = await userSessionModel
          .find({ session: bs.session._id })
          .countDocuments()
        // let totalTempAssignments = await assignmentModel
        //   .find({
        //     session: bs.session._id,
        //   })
        //   .countDocuments()
        let approvedAssignments = await assignmentModel
          .find({
            session: bs.session._id,
            status: 'approved',
          })
          .countDocuments()
        assignments.approvedAssignments =
          assignments.approvedAssignments + approvedAssignments
        const { assignmentDeadline } = await GlobalSettingModel.findOne({}, [
          'assignmentDeadline',
        ])
        // const { start } = await calendarModel.findOne(
        //   { sessionId: bs.session._id },
        //   ['start'],
        // )
        let start = new Date(Date.now())
        let notReviewed = await assignmentModel
          .find({
            session: bs.session._id,
            status: 'submitted',
          })
          .countDocuments()
        assignments.notReviewed = assignments.notReviewed + notReviewed
        let reiterate = await assignmentModel
          .find({
            session: bs.session._id,
            status: { $in: ['rework'] },
          })
          .countDocuments()
        assignments.IterateAssignments =
          assignments.IterateAssignments + reiterate
        let reviewed = await assignmentModel
          .find({
            session: bs.session._id,
            status: { $in: ['rejected', 'rework', 'approved'] },
          })
          .countDocuments()
        assignments.reviewed = assignments.reviewed + reviewed
        if (isOverDue(start, assignmentDeadline)) {
          assignments.overdue = assignments.overdue + (userCount - approved)
        }
        assignments.notSubmited =
          assignments.notSubmited + (userCount - (reviewed + notReviewed))
      }
      tempBatch.session = session
      tempBatch.assignments = assignments
      courses.push(tempBatch)
    }
    res.status(200).send(courses)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.GetCoursesDetials = GetCoursesDetials
