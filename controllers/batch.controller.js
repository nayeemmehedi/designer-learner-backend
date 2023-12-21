const courseModel = require('../models/course.model')
const batchModel = require('../models/batch.model')
const transactionModel = require('../models/transaction.model')
const calendarModel = require('../models/calendar.model')
const locationModel = require('../models/location.model')
const roomModel = require('../models/room.model')
const sessionModel = require('../models/session.model').Session
const userModel = require('../models/user.model')
const batchSessionModel = require('../models/batchSession.model')
const portfolioModel = require('../models/portfolio.model')
const userSessionModel = require('../models/userSessionmap.model')

const preSigner = require('../utils/urlGenerator.util')
const sendEmail = require('../utils/email.util')
const sendNotification = require('../utils/notification.util')
const { dateToTime } = require('../utils/time.util')

const getAllBatch = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skipIndex = (page - 1) * limit
  try {
    let response = {}
    let batchList = []
    const requiredFields = [
      '_id',
      'batchCode',
      'startDate',
      'endDate',
      'primaryMentorId',
      'operationCoId',
      'room',
      'location',
      'status',
    ]
    const totalBatches = await batchModel.find({}).countDocuments()
    const totalPages = Math.ceil(totalBatches / limit)
    const currentPage = page
    const batches = await batchModel
      .find({}, requiredFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
      .populate('primaryMentor', ['fullName', 'profilePicture'])
      .populate('operationCo', ['fullName', 'profilePicture'])

    for (let batch of batches) {
      batch = batch.toJSON()
      const usersCount = await transactionModel
        .find({ batch: batch._id, status: 'successful' })
        .countDocuments()
      const locationIds = await calendarModel
        .find({ eventId: batch._id })
        .distinct('locationId')
      const roomIds = await calendarModel
        .find({ eventId: batch._id })
        .distinct('roomId')
      const locations = await locationModel.find(
        { _id: { $in: locationIds } },
        ['locationName'],
      )
      const rooms = await roomModel.find({ _id: { $in: roomIds } }, [
        'roomName',
      ])
      if (batch?.primaryMentor?.profilePicture) {
        batch.primaryMentor.profilePicture = await preSigner(
          batch.primaryMentor,
          'profilePicture',
        )
      }
      if (batch?.operationCo?.profilePicture) {
        batch.operationCo.profilePicture = await preSigner(
          batch.operationCo,
          'profilePicture',
        )
      }
      batch.learnersCount = usersCount
      batch.locations = locations
      batch.rooms = rooms
      batchList.push(batch)
    }
    response.batches = batchList
    response.totalBatches = totalBatches
    response.totalPages = totalPages
    response.currentPage = currentPage
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}
module.exports.getAllBatch = getAllBatch

const createBatch = async (req, res) => {
  try {
    const payload = req.body

    const course = await courseModel.findOne({ _id: payload.courseId })
    let courseInitials = ''
    for (let initial of course.courseName.split(' ')) {
      courseInitials += initial[0]
    }
    const batchCount = (await batchModel.find({}).countDocuments()) + 1
    const batchCode = `${batchCount}-${courseInitials}`
    const batch = await batchModel.create({
      batchCode: batchCode,
      ...payload,
    })
    if (payload?.curriculumId) {
      const existingSessions = await sessionModel.find({
        curriculum: payload.curriculumId,
      })
      for (let existingSession of existingSessions) {
        const batchSession = new batchSessionModel({
          course: payload.courseId,
          curriculum: payload.curriculumId,
          session: existingSession._id,
          batch: batch._id,
        })
        await batchSession.save()
        // const sessionJSON = existingSession.toJSON()
        // delete sessionJSON._id
        // delete sessionJSON.id
        // if (sessionJSON.sessionType === 'Onboarding') {
        //   sessionJSON.sessionType = 'BatchOnboarding'
        //   const newSession = new batchOnboardingSessionModel({
        //     batch: batch._id,
        //     ...sessionJSON,
        //   })

        //   await newSession.save()
        // }
        // if (sessionJSON.sessionType === 'Evaluation') {
        //   sessionJSON.sessionType = 'BatchEvaluation'
        //   const newSession = new batchEvaluationSessionModel({
        //     batch: batch._id,
        //     ...sessionJSON,
        //   })
        //   await newSession.save()
        // }
        // if (sessionJSON.sessionType === 'Normal') {
        //   sessionJSON.sessionType = 'BatchNormal'
        //   const newSession = new batchNormalSessionModel({
        //     batch: batch._id,
        //     ...sessionJSON,
        //   })
        //   await newSession.save()
        // }
      }
    }
    if (payload.primaryMentorId) {
      let emailDetails = {}
      emailDetails.type = 'new_mentor'
      const mentor = await userModel.findOne(
        { uid: payload.primaryMentorId },
        ['fullName'],
      )
      emailDetails.name = mentor.fullName
      const mentorPortfolio = await portfolioModel.findOne(
        { uid: payload.primaryMentorId },
        ['about'],
      )
      emailDetails.about = mentorPortfolio?.about
      const users = await transactionModel.find({ batch: batch._id, status: 'successful' }).populate('madeBy')
      for (let user of users) {
        if (user?.madeBy?.email) {
          emailDetails.uName = user?.madeBy?.fullName
          emailDetails.receiver = user?.madeBy?.email
          sendEmail(emailDetails)
        }
        sendNotification({
          type: 'new_mentor',
          receiverId: user?.madeById,
          objectId: mentor?.uid,
          objectName: mentor?.fullName
        })
      }
    }
    res.status(200).json({ batch })
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.createBatch = createBatch

const deleteBatch = async (req, res) => {
  const id = req.params.id
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const batch = await batchModel.deleteOne({ _id: id })
    if (!batch) {
      return res.status(404).send('batch not found.')
    }
    res.status(200).json({ batch })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.deleteBatch = deleteBatch

const getOneBatch = async (req, res) => {
  const requiredFields = [
    '_id',
    'batchCode',
    'curriculumId',
    'repeatDays',
    'startDate',
    'endDate',
    'startTime',
    'endTime',
    'location',
    'room',
    'problemBriefs',
    'primaryMentorId',
    'operationCoId',
    'repeatDays',
    'repeatEvery',
    'hrCoId',
    'productCoId',
    'courseId',
    'status',
  ]

  try {
    const id = req.params.id
    if (!id) {
      res.status(403).json({ msg: `please provide a id` })
    }
    const batch = await batchModel
      .findOne({ _id: id }, requiredFields)
      .populate('courseId', ['courseName', 'courseCode', 'courseThumbnail'])
      .populate('curriculumId', ['version'])
      .populate('location', 'locationName')
      .populate('room', 'roomName')
      .populate('operationCo', ['fullName', 'profilePicture'])
      .populate('primaryMentor', ['fullName', 'profilePicture'])
      .populate('hrCo', ['fullName', 'profilePicture'])
      .populate('productCo', ['fullName', 'profilePicture'])

    if (!batch) {
      return res.status(404).send('location not found.')
    }

    if (batch.curriculumId) {
      batch._doc.sessions = await batchSessionModel
        .find({ curriculum: batch?.curriculumId?._id, batch: batch._id }, [
          '_id',
        ])
        .populate('session', ['sessionName'])
    }

    if (batch?.operationCo?.profilePicture) {
      batch.operationCo.profilePicture = await preSigner(
        batch.operationCo,
        'profilePicture',
      )
    }
    if (batch?.primaryMentor?.profilePicture) {
      batch.primaryMentor.profilePicture = await preSigner(
        batch.primaryMentor,
        'profilePicture',
      )
    }
    if (batch?.hrCo?.profilePicture) {
      batch.hrCo.profilePicture = await preSigner(batch.hrCo, 'profilePicture')
    }
    if (batch?.productCo?.profilePicture) {
      batch.productCo.profilePicture = await preSigner(
        batch.productCo,
        'profilePicture',
      )
    }
    if (batch?.courseId?.courseThumbnail) {
      batch.courseId.courseThumbnail = await preSigner(
        batch.courseId,
        'courseThumbnail',
      )
    }

    res.status(200).json({ batch })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getOneBatch = getOneBatch

const updateBatch = async (req, res) => {
  const id = req.params.id
  const payload = req.body

  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const batch = await batchModel.findOne({ _id: req.params.id })
    if (!batch) {
      return res.status(404).send('batch not found.')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      batch[update] = req.body[update]
    }
    await batch.save()
    if (payload.primaryMentorId) {
      let emailDetails = {}
      emailDetails.type = 'new_mentor'
      const mentor = await userModel.findOne(
        { uid: payload.primaryMentorId },
        ['uid', 'fullName'],
      )
      emailDetails.name = mentor.fullName
      const mentorPortfolio = await portfolioModel.findOne(
        { uid: payload.primaryMentorId },
        ['about'],
      )
      emailDetails.about = mentorPortfolio?.about
      const users = await transactionModel.find({ batch: batch._id, status: 'successful' }).populate('madeBy')
      for (let user of users) {
        if (user?.madeBy?.email) {
          emailDetails.uName = user?.madeBy?.fullName
          emailDetails.receiver = user?.madeBy?.email
          sendEmail(emailDetails)
        }
        sendNotification({
          type: 'new_mentor',
          receiverId: user?.madeById,
          objectId: mentor?.uid,
          objectName: mentor?.fullName,
          batchId: batch._id.toString(),
          courseId: batch.courseId
        })
      }
    }
    res.status(200).json({ batch })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.updateBatch = updateBatch

const filterBatch = async (req, res) => {
  try {
    const response = {}
    const requiredFields = [
      '_id',
      'batchCode',
      'startDate',
      'endDate',
      'operationCo',
      'room',
      'location',
      'hrCo',
      'status',
    ]
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    let findFilter = {}
    if (req.query.startTime || req.query.endTime) {
      findFilter.calendar = {}
    }
    let populateFilter = {}
    if (req.query.status) {
      findFilter.status = req.query.status
    }
    if (req.query.courseId) {
      findFilter.courseId = {}
      findFilter.courseId._id = req.params.courseId
    }
    if (req.query.operationCoId) {
      findFilter.operationCoId = req.query.operationCoId
    }
    if (req.query.primaryMentorId) {
      findFilter.primaryMentorId = req.query.primaryMentorId
    }
    if (req.query.locationId) {
      findFilter.location = {}
      findFilter.location._id = req.query.locationId
    }
    if (req.query.roomId) {
      findFilter.room = {}
      findFilter.room._id = req.query.roomId
    }
    if (req.query.startDate) {
      populateFilter.startDate = { $gte: req.query.startDate }
    }
    if (req.query.endDate) {
      populateFilter.endDate = { $lte: req.query.endDate }
    }
    if (req.query.startTime) {
      let sTime = dateToTime(parseInt(req.query.startTime))
      findFilter.calendar.startTime = { $gte: sTime }
    }
    if (req.query.endTime) {
      let eTime = dateToTime(parseInt(req.query.endTime))

      findFilter.calendar.endTime = { $lte: eTime }
    }
    const totalBatches = await batchModel.find(findFilter).countDocuments()
    const totalPages = Math.ceil(totalBatches / limit)
    const currentPage = page
    const batches = await batchModel
      .find(findFilter, requiredFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
      .populate('location', 'locationName')
      .populate('room', 'roomName')

    for (let batch of batches) {
      const usersCount = await transactionModel
        .find({ batch: batch._id, status: 'successful' })
        .countDocuments()
      batch._doc.usersCount = usersCount
    }

    response.batches = batches
    response.totalBatches = totalBatches
    response.totalPages = totalPages
    response.currentPage = currentPage

    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.filterBatch = filterBatch

// date , status, course, mentor, ops co, location, room, time
