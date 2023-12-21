const mongoose = require('mongoose')

const assignmentModel = require('../models/assignment.model')
const batchSessionModel = require('../models/batchSession.model')
const transactionModel = require('../models/transaction.model')
const calendarModel = require('../models/calendar.model')

const preSigner = require('../utils/urlGenerator.util')

const submitAssignment = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      madeById: req.uid,
      productId: req.params.id,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res.status(404).send('You are not enrolled in the course')
    }
    const assignmentSession = await batchSessionModel
      .findOne({
        batch: transaction.batch,
        _id: req.params.sessionId,
      })
      .populate('session')
    const assignment = assignmentSession.session.assignments.find(
      (assignment) => assignment._id.toString() === req.params.assignmentId,
    )
    if (!assignment) {
      return res.status(404).send('Assignment not found')
    }
    const submission = new assignmentModel({
      uid: req.uid,
      assignment: req.params.assignmentId,
      batch: req.params.id,
      session: req.params.sessionId,
      status: 'submitted',
      prototypeLink: req.body.prototypeLink,
    })
    if (req.files.canvas) {
      submission.canvas = req.files.canvas[0].key
    }
    if (req.files.figmaActivityFile) {
      submission.figmaActivityFile = req.files.figmaActivityFile[0].key
    }
    await submission.save()
    return res.status(200).send(submission)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.submitAssignment = submitAssignment

const getAssignment = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      madeById: req.uid,
      productId: req.params.id,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res.status(404).send('You are not enrolled in the course')
    }
    const assignment = await assignmentModel.findOne({
      uid: req.uid,
      assignment: req.params.assignmentId,
      batch: transaction.batch,
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

module.exports.getAssignment = getAssignment

const updateAssignment = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      madeById: req.uid,
      productId: req.params.id,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res.status(404).send('You are not enrolled in the course')
    }
    const assignment = await assignmentModel.findOne({
      uid: req.uid,
      assignment: req.params.assignmentId,
      batch: transaction.batch,
      session: req.params.sessionId,
    })
    if (!assignment) {
      return res.status(404).send('Assignment not found')
    }
    const updates = Object.keys(req.body)
    updates.forEach((update) => (assignment[update] = req.body[update]))
    if (req.files.canvas) {
      assignment.canvas = req.files.canvas[0].key
    }
    if (req.files.figmaActivityFile) {
      assignment.figmaActivityFile = req.files.figmaActivityFile[0].key
    }
    await assignment.save()
    return res.status(200).send(assignment)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateAssignment = updateAssignment

const getPendingAssignments = async (req, res) => {
  try {
    const batchIds = await transactionModel
      .find({
        madeById: req.uid,
        transactionType: 'Course',
        status: 'successful',
      })
      .distinct('batch')

    let status = [
      'submitted',
      'approved',
      'rework',
      'rejected',
      'not-submitted',
    ]
    if (req.query.status) {
      status = req.query.status.split(',')
    }
    let { startDate, endDate } = req.query
    startDate = new Date(startDate).setHours(00, 00)
    endDate = new Date(endDate).setHours(23, 59)

    const events = await calendarModel.find({
      eventId: { $in: batchIds },
      start: { $gte: startDate, $lte: endDate },
      end: { $gte: startDate, $lte: endDate },
    })
    let sessionIds_set = new Set()
    for (let event of events) {
      sessionIds_set.add(event.sessionId)
    }
    let sessionIds = Array.from(sessionIds_set)

    const sessions = await batchSessionModel
      .find({ _id: { $in: sessionIds } }, [
        '_id',
        'session',
        'course',
        'curriculum',
      ])
      .populate('session', ['_id', 'assignments', 'sessionName'])
    for (let session of sessions) {
      const assignments = await assignmentModel.find({
        uid: req.uid,
        session: session._id,
        status: { $in: status },
      })

      for (let assignment of assignments) {
        let sessionAssignment = session.session.assignments.find(
          (elem) => elem._id.toString() == assignment.assignment,
        )
        if (sessionAssignment) {
          sessionAssignment._doc.status = assignment.status
        }
      }
    }

    const response = {}
    response.sessions = sessions
    response.submittedCount = await assignmentModel
      .find({ uid: req.uid, status: 'submitted' })
      .countDocuments()
    response.approvedCount = await assignmentModel
      .find({ uid: req.uid, status: 'approved' })
      .countDocuments()
    response.reworkCount = await assignmentModel
      .find({ uid: req.uid, status: 'rework' })
      .countDocuments()
    response.rejectedCount = await assignmentModel
      .find({ uid: req.uid, status: 'rejected' })
      .countDocuments()
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getPendingAssignments = getPendingAssignments
