const UserSessionMapModel = require('../models/userSessionmap.model')
const batchModel = require('../models/batch.model')
const batchSessionModel = require('../models/batchSession.model')
const sessionModel = require('../models/session.model').Session
const preSigner = require('../utils/urlGenerator.util')
const CalendarModel = require('../models/calendar.model')
const { getDeadline, isOverDue } = require('../utils/deadline.util')
const userSessionmapModel = require('../models/userSessionmap.model')
const assignmentModel = require('../models/assignment.model')
const GlobalSettingModel = require('../models/globalsettings.model')

const getAssignmentsByBatch = async (req, res) => {
  const batchId = req.params.batchId
  try {
    let response = {}
    response.assignments = []
    const batch = await batchModel.findOne({
      _id: batchId,
      primaryMentorId: req.uid,
    })
    const sessionIds = await sessionModel
      .find({
        curriculum: batch.curriculumId,
        sessionType: 'Normal',
      })
      .distinct('_id')
    const sessions = await batchSessionModel.find({
      batch: batchId,
      session: { $in: sessionIds },
    })
    const { assignmentDeadline } = await GlobalSettingModel.findOne({}, [
      'assignmentDeadline',
    ])
    for (let session of sessions) {
      let sessionAssignment = {}
      sessionAssignment.sessionName = session.sessionName
      const userCount = await userSessionmapModel
        .find({ session: session._id })
        .countDocuments()
      response.totalUsers = userCount

      for (let assignment of session.assignments) {
        sessionAssignment.assignment = assignment
        sessionAssignment.users = []
        const approvedAssignments = await assignmentModel
          .find({
            assignment: assignment._id,
            session: session._id,
            status: 'approved',
          })
          .countDocuments()
        const users = await assignmentModel
          .find(
            {
              assignment: assignment._id,
              session: session._id,
              status: { $in: ['submitted', 'approved', 'rework'] },
            },
            ['uid'],
          )
          .limit(3)
          .populate('user', ['fullName', 'profilePicture'])
        for (let userObj of users) {
          let { user } = userObj
          if (user?.profilePicture) {
            user.profilePicture = await preSigner(user, 'profilePicture')
          }
          sessionAssignment.users.push(user)
        }
        const reviewedAssignments = await assignmentModel
          .find({
            assignment: assignment._id,
            session: session._id,
            status: { $in: ['approved', 'rework'] },
          })
          .countDocuments()
        const { start } = await CalendarModel.findOne(
          { sessionId: session._id },
          ['start'],
        )
        if (userCount == approvedAssignments) {
          sessionAssignment.status = 'approved'
        } else if (userCount == reviewedAssignments) {
          sessionAssignment.status = 'reviewed'
        } else {
          sessionAssignment.status = 'not-reviewed'
        }
        if (
          isOverDue(start, assignmentDeadline) &&
          userCount != approvedAssignments
        ) {
          sessionAssignment.status = 'overDue'
        }
        sessionAssignment.reviewed = reviewedAssignments
      }
      response.assignments.push(sessionAssignment)
    }
    res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

const getAssignment = async (req, res) => {
  try {
    const assignment = await assignmentModel.findOne({
      assignment: req.params.assignmentId,
      session: req.params.sessionId,
    })
    if (!assignment) {
      return res.status(404).send('Assignment not found')
    }
    if (assignment?.canvas) {
      assignment.canvas = await preSigner(assignment, 'canvas')
    }
    if (assignment?.figmaActivityFile) {
      assignment.figmaActivityFile = await preSigner(
        assignment,
        'figmaActivityFile',
      )
    }
    return res.status(200).send(assignment)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

const updateAssignment = async (req, res) => {
  try {
    const assignment = await assignmentModel.findOne({
      assignment: req.params.assignmentId,
      session: req.params.sessionId,
    })
    const updates = Object.keys(req.body)
    updates.forEach((update) => (assignment[update] = req.body[update]))
    await assignment.save()
    return res.status(200).send(assignment)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports = {
  getAssignmentsByBatch,
  getAssignment,
  updateAssignment,
}
