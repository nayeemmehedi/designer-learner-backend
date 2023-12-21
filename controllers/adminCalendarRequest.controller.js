const calendarRequestModel = require('../models/calendarRequest.model')
const userSessionModel = require('../models/userSessionmap.model')
const userModel = require('../models/user.model')
const calendarModel = require('../models/calendar.model')
const sessionModel = require('../models/session.model').Session
const batchModel = require('../models/batch.model')
const preSigner = require('../utils/urlGenerator.util')
const sendEmail = require('../utils/email.util')
const getAllRequestByStatus = async (req, res) => {
  try {
    let response = {}
    response.requests = []
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    let filter = {}
    filter.status = req.params.status
    const requests = await calendarRequestModel
      .find(filter)
      .populate('calendar', ['eventId', 'start', 'sessionId'])
      .populate('mentor', ['fullName', 'profilePicture'])
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
    for (let request of requests) {
      let mentor = request.mentor

      if (mentor?.profilePicture) {
        try {
          mentor.profilePicture = await preSigner(mentor, 'profilePicture')
        } catch (e) {}
      }

      const batchId = request.calendar.eventId
      const { batchCode } = await batchModel.findOne({ _id: batchId }, [
        'batchCode',
      ])
      const sessionId = request.calendar.sessionId
      const { sessionName } = await sessionModel.findOne({ _id: sessionId })
      let req = { ...request._doc, batchCode, sessionName, mentor }

      response.requests.push(req)
    }
    res.status(200).json(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

const getOneRequest = async (req, res) => {
  try {
    const id = req.params.id
    let response = {}
    const request = await calendarRequestModel
      .findOne({ _id: id })
      .populate('calendar', ['eventId', 'start', 'sessionId'])
      .populate('mentor')
    if (request?.mentor?.profilePicture) {
      request.mentor.profilePicture = await preSigner(
        request.mentor,
        'profilePicture',
      )
    }
    const batchId = request.calendar.eventId
    const { batchCode } = await batchModel.findOne({ _id: batchId }, [
      'batchCode',
    ])
    const sessionId = request.calendar.sessionId
    const { sessionName } = await sessionModel.findOne({ _id: sessionId })

    response = { ...request._doc, batchCode, sessionName }

    res.status(200).json(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

const updateRequest = async (req, res) => {
  try {
    const id = req.params.id
    if (!id) {
      res.status(403).json({ msg: `please provide a id` })
    }
    const request = await calendarRequestModel.findOne({ _id: id })
    if (!request) {
      return res.status(404).send('request not founds')
    }
    if (req.params.action == 'accept') {
      const CalId = request.calendar
      const calendar = await calendarModel.findOne({ _id: CalId })
      if (!calendar) {
        return res.status(404).send('calendar not found.')
      }
      let { start, end, startTime, endTime } = request
      calendar.start = start
      calendar.end = end
      calendar.startTime = startTime
      calendar.endTime = endTime
      await calendar.save()
      request.status = 'approved'
      await request.save()
      startTime = startTime.toString()
      let ftime =
        startTime[0] + startTime[1] + ':' + startTime[2] + startTime[3]
      let fdate = new Date(start).toDateString()

      // notification
      let details = {}
      details.type = 'reschedule'
      details.date = fdate
      details.time = ftime
      const users = await userSessionModel.find({ batch: calendar.eventId }, [
        'userId',
      ])
      const { sessionName } = await sessionModel.findOne(
        { _id: calendar.sessionId },
        ['sessionName'],
      )
      details.sessionName = sessionName
      for (let user of users) {
        const { email, fullName } = await userModel.findOne(
          { uid: user.userId },
          ['email', 'fullName'],
        )
        if (email) {
          details.name = fullName
          details.receiver = email
          sendEmail(details)
        }
      }
    }
    if (req.params.action == 'reject') {
      request.status = 'rejected'
      await request.save()
    }
    res.status(200).json(request)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}
module.exports = {
  getAllRequestByStatus,
  getOneRequest,
  updateRequest,
}
