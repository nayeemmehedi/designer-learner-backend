const mentorProfileModel = require('../models/mentorProfile.model')
const batchModel = require('../models/batch.model')
const preSigner = require('../utils/urlGenerator.util')
const userModel = require('../models/user.model')
const sendEmail = require('../utils/email.util')
const roleModel = require('../models/role.model')
const transactionModel = require('../models/transaction.model')
const portfolioModel = require('../models/portfolio.model')
const calendarModel = require('../models/calendar.model')
const locationModel = require('../models/location.model')

const inviteMentor = async (req, res) => {
  const id = req.params.id
  try {
    const user = await userModel.findOne({ uid: id })
    if (!user) {
      return res.status(404).send('user not found')
    }
    const existingProfile = await mentorProfileModel.findOne({ uid: id })
    if (existingProfile) {
      return res.status(403).send('mentor already invited')
    }
    const mentorProfile = new mentorProfileModel({
      uid: id,
      invitationStatus: 'invited',
      ...req.body,
    })
    await mentorProfile.save()
    const mailDetails = { receiver: user.email, type: 'mentor_invite' }
    sendEmail(mailDetails)
    const response = { ...mentorProfile._doc }
    response.name = user.fullName
    response.email = user.email
    if (user?.profilePicture) {
      response.profilePicture = await preSigner(user, 'profilePicture')
    }
    res.status(200).send(response)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

const getAllMentors = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skipIndex = (page - 1) * limit
  try {
    let response = {}
    const requiredFields = [
      'uid',
      'fullName',
      'profilePicture',
      'email',
      'phone',
    ]
    const mentorRoles = await roleModel.find({ roleCategory: 'mentor' })
    let mentorRolesIds = []
    for (let mentorRole of mentorRoles) {
      mentorRolesIds.push(mentorRole._id)
    }
    const mentorsCount = await userModel
      .find({ roles: { $in: mentorRolesIds } })
      .countDocuments()
    const totalPages = Math.ceil(mentorsCount / limit)
    const currentPage = page
    const mentors = await userModel
      .find({ roles: { $in: mentorRolesIds } }, requiredFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)

    for (let mentor of mentors) {
      if (mentor?.profilePicture) {
        mentor.profilePicture = await preSigner(mentor, 'profilePicture')
      }
      const mentorProfile = await mentorProfileModel.findOne({
        uid: mentor.uid,
      })
      const totalBatchesCount = await batchModel
        .find({ primaryMentorId: mentor.uid })
        .countDocuments()
      const liveBatches = await batchModel
        .find({ primaryMentorId: mentor.uid, status: 'live' })
        .countDocuments()
      let batchIds = []
      const batches = await batchModel.find({ primaryMentorId: mentor.uid })
      for (let batch of batches) {
        batchIds.push(batch._id)
      }
      const locationIds = await calendarModel
        .find({ eventId: { $in: batchIds } })
        .distinct('locationId')
      const locations = await locationModel.find({ _id: { $in: locationIds } })
      const locationNames = []
      for (let location of locations) {
        locationNames.push(location.locationName)
      }
      mentor._doc.invitationStatus = mentorProfile?.invitationStatus
      mentor._doc.renumeration = mentorProfile?.remuneration
      mentor._doc.totalBatches = totalBatchesCount
      mentor._doc.liveBatches = liveBatches
      mentor._doc.status = mentorProfile?.status
      mentor._doc.locations = locationNames.join(', ')
    }
    response.mentors = mentors
    response.totalMentors = mentorsCount
    response.totalPages = totalPages
    response.currentPage = currentPage
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

const getOneMentor = async (req, res) => {
  const id = req.params.id
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  const response = {}
  const requiredFields = [
    '_id',
    'batchCode',
    'startDate',
    'endDate',
    'primaryMentorId',
    'operationCoId',
    'room',
    'location',
    'sessions',
    'status',
  ]
  try {
    const mentor = await userModel.findOne({ uid: id })
    if (!mentor) {
      return res.status(404).send('mentor not found.')
    }

    if (mentor?.profilePicture) {
      mentor.profilePicture = await preSigner(mentor, 'profilePicture')
    }

    const mentorPortfolio = await portfolioModel.findOne({ uid: id })
    if (mentorPortfolio) {
      const mentorPortfolioJSON = mentorPortfolio.toJSON()
      const fileFields = [
        'bankStatement',
        'payslips',
        'buisnessProof',
        'addressProof',
      ]
      for (let fileField of fileFields) {
        if (mentorPortfolioJSON[fileField]) {
          mentorPortfolioJSON[fileField] = await preSigner(
            mentorPortfolioJSON,
            fileField,
          )
        }
      }
      if (mentorPortfolioJSON?.panCard?.front) {
        mentorPortfolioJSON.panCard.front = await preSigner(
          mentorPortfolioJSON.panCard,
          'front',
        )
      }
      if (mentorPortfolioJSON?.panCard?.back) {
        mentorPortfolioJSON.panCard.back = await preSigner(
          mentorPortfolioJSON.panCard,
          'back',
        )
      }
      if (mentorPortfolioJSON?.adhaarCard?.front) {
        mentorPortfolioJSON.adhaarCard.front = await preSigner(
          mentorPortfolioJSON.adhaarCard,
          'front',
        )
      }
      if (mentorPortfolioJSON?.adhaarCard?.back) {
        mentorPortfolioJSON.adhaarCard.back = await preSigner(
          mentorPortfolioJSON.adhaarCard,
          'back',
        )
      }
      response.portfolio = mentorPortfolioJSON
    }
    const mentorProfile = await mentorProfileModel
      .findOne({ uid: id })
      .populate('courseEligibilty', ['courseName'])
    if (mentorProfile) {
      if (mentorProfile?.pan?.panCardFront) {
        mentorProfile.pan.panCardFront = await preSigner(
          mentorProfile.pan,
          'panCardFront',
        )
      }
      if (mentorProfile?.pan?.panCardBack) {
        mentorProfile.pan.panCardBack = await preSigner(
          mentorProfile.pan,
          'panCardBack',
        )
      }
      if (mentorProfile?.aadhaarCardFront) {
        mentorProfile.aadhaarCardFront = await preSigner(
          mentorProfile.aadhaar,
          'aadhaarCardFront',
        )
      }
      if (
        mentorProfile?.mentorAgreement &&
        mentorProfile?.mentorAgreement?.length
      ) {
        for (let i = 0; i < mentorProfile.mentorAgreement.length; i++) {
          mentorProfile.mentorAgreement[i] = await preSigner(
            mentorProfile.mentorAgreement,
            i,
          )
        }
      }
      const batches = await batchModel.find(
        { primaryMentorId: id },
        requiredFields,
      )
      for (let batch of batches) {
        const userCount = await transactionModel
          .find({ batch: batch._id, status: 'successful' })
          .countDocuments()
        batch._doc.learnersCount = userCount
      }
      const batchIds = await batchModel
        .find({ primaryMentorId: id })
        .distinct('_id')
      const calendars = await calendarModel.find({ eventId: { $in: batchIds } })
      mentorProfile._doc.calendars = calendars
      mentorProfile._doc.batches = batches
      response.mentorProfile = mentorProfile
    }
    response.mentor = mentor
    response.invitationStatus = mentorProfile?.invitationStatus || 'not-invited'

    res.status(200).json(response)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

const updateMentorProfile = async (req, res) => {
  const id = req.params.id
  if (!id) {
    res.status(403).json({ msg: `please provide id` })
  }
  try {
    const mentor = await userModel.findOne({ uid: id })
    if (!mentor) {
      return res.status(404).send('mentor not found.')
    }

    if (req.query.section === 'portfolio') {
      const portfolio = await portfolioModel.findOne({ uid: id })
      if (!portfolio) {
        return res.status(404).send('portfolio not found.')
      }
      const updates = Object.keys(req.body)
      for (let update of updates) {
        portfolio[update] = req.body[update]
      }
      if (req.files.bankStatement) {
        portfolio.bankStatement = req.files.bankStatement[0].key
      }
      if (req.files.payslips) {
        portfolio.payslips = req.files.payslips[0].key
      }
      if (req.files.buisnessProof) {
        portfolio.buisnessProof = req.files.buisnessProof[0].key
      }
      if (req.files.panCardFront) {
        portfolio.panCard.front = req.files.panCardFront[0].key
      }
      if (req.files.panCardBack) {
        portfolio.panCard.back = req.files.panCardBack[0].key
      }
      if (req.files.aadhaarCardFront) {
        portfolio.adhaarCard.front = req.files.aadhaarCardFront[0].key
      }
      if (req.files.aadhaarCardBack) {
        portfolio.adhaarCard.back = req.files.aadhaarCardBack[0].key
      }
      if (req.files.addressProof) {
        portfolio.addressProof = req.files.addressProof[0].key
      }
      await portfolio.save()
      return res.status(200).send(portfolio)
    }

    const mentorProfile = await mentorProfileModel.findOne({ uid: id })
    if (!mentor) {
      return res.status(404).send('mentor profile not found')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      mentorProfile[update] = req.body[update]
    }
    if (req.files.aadhaarCardFront) {
      mentorProfile.aadhaar.aadhaarCardFront = req.files.aadhaarCardFront[0].key
    }
    if (req.files.panCardFront) {
      mentorProfile.pan.panCardFront = req.files.panCardFront[0].key
    }
    if (req.files.panCardBack) {
      mentorProfile.pan.panCardBack = req.files.panCardBack[0].key
    }
    if (req.files.aadhaarCardBack) {
      mentorProfile.aadhaar.aadhaarCardBack = req.files.aadhaarCardBack[0].key
    }
    if (req.files.mentorAgreement) {
      for (let i = 0; i < req.files.mentorAgreement.length; i++) {
        mentorProfile.mentorAgreement[i] = req.files.mentorAgreement[i].key
      }
    }
    await mentorProfile.save()
    res.status(200).json(mentorProfile)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

const searchMentors = async (req, res) => {
  try {
    const requiredFields = ['uid', 'fullName', 'profilePicture', 'email']
    const mentorRoles = await roleModel.find({ roleCategory: 'mentor' })
    let mentorRolesIds = []
    for (let mentorRole of mentorRoles) {
      mentorRolesIds.push(mentorRole._id)
    }
    const mentors = await userModel.find(
      { roles: { $in: mentorRolesIds } },
      requiredFields,
    )
    for (let mentor of mentors) {
      if (mentor?.profilePicture) {
        mentor.profilePicture = await preSigner(mentor, 'profilePicture')
      }
    }
    return res.status(200).send(mentors)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

const filterMentors = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skipIndex = (page - 1) * limit
  try {
    let response = {}
    let notMatchingMentor = []

    let filter = {}
    let locArr
    if (req.query.location) {
      locArr = req.query.location.split(',')
    }
    const requiredFields = [
      'uid',
      'fullName',
      'profilePicture',
      'email',
      'phone',
    ]
    const mentorRoles = await roleModel.find({ roleCategory: 'mentor' })
    let mentorRolesIds = []
    for (let mentorRole of mentorRoles) {
      mentorRolesIds.push(mentorRole._id)
    }
    filter.roles = { $in: mentorRolesIds }
    const mentorsCount = await userModel.find(filter).countDocuments()
    const mentors = await userModel
      .find(filter, requiredFields)
      .sort({ createdAt: -1 })

    for (let mentor of mentors) {
      if (mentor?.profilePicture) {
        mentor.profilePicture = await preSigner(mentor, 'profilePicture')
      }

      const mentorProfile = await mentorProfileModel.findOne({
        uid: mentor.uid,
      })

      if (req.query.remuneration_min && req.query.remuneration_max) {
        if (!mentorProfile?.remuneration) {
          notMatchingMentor.push(mentor._id)
          continue
        }
        if (
          !(
            mentorProfile?.remuneration >= req.query.remuneration_min &&
            mentorProfile?.remuneration <= req.query.remuneration_max
          )
        ) {
          notMatchingMentor.push(mentor._id)
          continue
        }
      }
      if (req.query.status) {
        if (
          mentorProfile?.status != req.query.status ||
          !mentorProfile?.status
        ) {
          notMatchingMentor.push(mentor._id)
          continue
        }
      }
      const totalBatchesCount = await batchModel
        .find({ primaryMentorId: mentor.uid })
        .countDocuments()
      if (req.query.totalBatches_min && req.query.toatlBatches_max) {
        if (
          !(
            totalBatchesCount > req.query.totalBatches_min &&
            totalBatchesCount < req.query.totalBatches_max
          )
        ) {
          notMatchingMentor.push(mentor._id)
          continue
        }
      }
      const liveBatches = await batchModel
        .find({ primaryMentorId: mentor.uid, status: 'live' })
        .countDocuments()
      if (req.query.liveBatches) {
        if (
          !(
            liveBatches > req.query.liveBatches_min &&
            liveBatches < req.query.liveBatches_max
          )
        ) {
          notMatchingMentor.push(mentor._id)
          continue
        }
      }
      let batchIds = []
      const batches = await batchModel.find({ primaryMentorId: mentor.uid })
      for (let batch of batches) {
        batchIds.push(batch._id)
      }

      const locationIds = await calendarModel
        .find({ eventId: { $in: batchIds } })
        .distinct('locationId')
      const locations = await locationModel.find({ _id: { $in: locationIds } })
      const locationNames = []
      let match = false
      for (let location of locations) {
        if (req.query.location) {
          if (locArr.includes(location.locationName)) {
            match = true
          }
        }
        locationNames.push(location.locationName)
      }
      if (req.query.location) {
        if (!match) {
          notMatchingMentor.push(mentor._id)
          continue
        }
      }

      mentor._doc.invitationStatus = mentorProfile?.invitationStatus
      mentor._doc.renumeration = mentorProfile?.remuneration
      mentor._doc.totalBatches = totalBatchesCount
      mentor._doc.liveBatches = liveBatches
      mentor._doc.status = mentorProfile?.status
      mentor._doc.locations = locationNames.join(', ')
    }

    for (let i = 0; i < mentors.length; i++) {
      if (notMatchingMentor.includes(mentors[i]._id)) {
        mentors.splice(i, 1)
      }
    }
    const mentorsResponse = mentors.slice(skipIndex, skipIndex + limit)
    response.mentors = mentorsResponse
    response.totalMentors = mentors.length
    response.totalPages = Math.ceil(mentors.length / limit)
    response.currentPage = page
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}
module.exports = {
  getAllMentors,
  getOneMentor,
  inviteMentor,
  updateMentorProfile,
  searchMentors,
  filterMentors,
}
