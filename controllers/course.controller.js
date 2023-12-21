const courseModel = require('../models/course.model')
const batchModel = require('../models/batch.model')
const calendarModel = require('../models/calendar.model')
const locationModel = require('../models/location.model')
const userSessionMapModel = require('../models/userSessionmap.model')
const transactionModel = require('../models/transaction.model')
const onboardingSessionModel = require('../models/session.model')
  .OnboardingSession
const normalSessionModel = require('../models/session.model').NormalSession
const evaluationSessionModel = require('../models/session.model')
  .EvaluationSession
const sessionModel = require('../models/session.model').Session
const batchSessionModel = require('../models/batchSession.model')
const curriculumModel = require('../models/curriculum.model')
const kycModel = require('../models/kyc.model')

const preSigner = require('../utils/urlGenerator.util')

const addCourse = async (req, res) => {
  try {
    const course = new courseModel({
      modifierId: req.uid,
      ...req.body,
    })
    await course.save()
    return res.status(200).send(course)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.addCourse = addCourse

const updateCourse = async (req, res) => {
  try {
    const fileNamesArray = [
      'courseThumbnail',
      'benefitsCardOneIcon',
      'benefitsCardTwoIcon',
      'benefitsCardThreeIcon',
      'benefitsCardFourIcon',
      'eligibilityCardOneIcon',
      'eligibilityCardTwoIcon',
      'eligibilityCardThreeIcon',
      'eligibilityCardFourIcon',
      'careerProCardOneIcon',
      'careerProCardTwoIcon',
      'careerProCardThreeIcon',
      'careerProCardFourIcon',
    ]

    const course = await courseModel.findOne(
      { _id: req.params.id },
      { upsert: true },
    )
    if (!course) {
      return res.status(404).send({ message: 'Course not found' })
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      course[update] = req.body[update]
    }
    course.modifierId = req.uid
    // let testimonialsArray = []
    // if (req.files?.testimonials) {
    //   req.files.testimonials.forEach((file) => {
    //     testimonialsArray.push(file.key)
    //   })
    // }

    // course.testimonials = testimonialsArray

    if (req.files?.moduleIcon) {
      req.files.moduleIcon.forEach((file, index) => {
        course.modules[index].moduleIcon = file.key
      })
    }

    for (let fileName of fileNamesArray) {
      if (req.files[fileName]) {
        course[fileName] = req.files[fileName][0].key
      }
    }
    await course.save()
    return res.status(200).send(course)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateCourse = updateCourse

const activateCourse = async (req, res) => {
  try {
    const course = await courseModel.findOne({ _id: req.params.id })
    if (!course) {
      return res.status(404).send({ message: 'Course not found' })
    }
    course.status = 'active'
    await course.save()
    return res.status(200).send(course)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.activateCourse = activateCourse

const deactivateCourse = async (req, res) => {
  try {
    const course = await courseModel.findOne({ _id: req.params.id })
    if (!course) {
      return res.status(404).send({ message: 'Course not found' })
    }
    course.status = 'inactive'
    await course.save()
    return res.status(200).send(course)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.deactivateCourse = deactivateCourse

const deleteCourse = async (req, res) => {
  try {
    const course = await courseModel.findOne({ _id: req.params.id })
    if (!course) {
      return res.status(404).send({ message: 'Course not found' })
    }
    await course.remove()
    return res.status(200).send(course)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.deleteCourse = deleteCourse

const listAllCourses = async (req, res) => {
  try {
    const response = {}
    const requiredFields = [
      'courseName',
      'courseDuration',
      'basePrice',
      'sessionCount',
      'sessionDuration',
      'status',
      'URL',
      'courseThumbnail',
    ]
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    const totalCourses = await courseModel.countDocuments()
    const totalPages = Math.ceil(totalCourses / limit)

    const courses = await courseModel
      .find({}, requiredFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)

    for (let course of courses) {
      if (course.courseThumbnail) {
        course.courseThumbnail = await preSigner(course, 'courseThumbnail')
      }
      const latestCurriculum = await curriculumModel
        .find({ course: course._id })
        .sort({ _id: -1 })
        .limit(1)
      course._doc.latestVersion = latestCurriculum[0]?.version
      course._doc.sessionDuration = latestCurriculum[0]?.sessionDuration
    }

    response.courses = courses
    response.totalCourses = totalCourses
    response.totalPages = totalPages
    response.currentPage = page

    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.listAllCourses = listAllCourses

const getCourseCatalogue = async (req, res) => {
  try {
    const requiredFields = [
      'courseName',
      'courseStartDate',
      'basePrice',
      'tagline',
      'courseDuration',
      'sessionCount',
      'skillLevels',
      'modeOfConduct',
      'courseThumbnail',
      'mentorsFour',
      'overviewLocation',
      'testimonials',
    ]
    const courses = await courseModel.find({ status: 'active' }, requiredFields)
    for (let course of courses) {
      if (course.courseThumbnail) {
        course.courseThumbnail = await preSigner(course, 'courseThumbnail')
      }
    }
    return res.status(200).send(courses)
  } catch (e) {
    console.log(e)
  }
}

module.exports.getCourseCatalogue = getCourseCatalogue

const getCourseDetails = async (req, res) => {
  try {
    if (req.role === 'admin') {
      const course = await courseModel
        .findOne({ _id: req.params.id })
        .populate('mentors', ['fullName', 'profilePicture', 'uid'])
        .populate('modifiedBy', ['fullName', 'profilePicture', 'uid'])
        .populate('overviewLocation', ['locationName', 'address'])
      if (!course) {
        return res.status(404).send({ message: 'Course not found' })
      }

      if (course.courseThumbnail) {
        course.courseThumbnail = await preSigner(course, 'courseThumbnail')
      }

      if (course?.modifiedBy?.profilePicture) {
        course.modifiedBy.profilePicture = await preSigner(
          course.modifiedBy,
          'profilePicture',
        )
      }

      if (course?.mentors) {
        for (let mentor of course.mentors) {
          if (mentor?.profilePicture) {
            mentor.profilePicture = await preSigner(mentor, 'profilePicture')
          }
        }
      }

      if (course?.benefits?.cards?.length > 0) {
        for (let card of course.benefits.cards) {
          if (card.icon) {
            card.icon = await preSigner(card, 'icon')
          }
        }
      }

      if (course?.courseOutcomes?.cards?.length > 0) {
        for (let card of course.courseOutcomes.cards) {
          if (card.icon) {
            card.icon = await preSigner(card, 'icon')
          }
        }
      }

      if (course?.eligibility?.cards?.length > 0) {
        for (let card of course.eligibility.cards) {
          if (card.icon) {
            card.icon = await preSigner(card, 'icon')
          }
        }
      }

      if (course?.careerPro?.cards?.length > 0) {
        for (let card of course.careerPro.cards) {
          if (card.icon) {
            card.icon = await preSigner(card, 'icon')
          }
        }
      }

      if (course.testimonials.length > 0) {
        course.testimonials.forEach(async (file, index) => {
          course.testimonials[index] = await preSigner(
            course.testimonials,
            index,
          )
        })
      }

      if (course.modules.length > 0) {
        for (let module of course.modules) {
          if (module.moduleIcon) {
            module.moduleIcon = await preSigner(module, 'moduleIcon')
          }
        }
      }

      if (course.imageCarousel.length > 0) {
        for (let image of course.imageCarousel) {
          if (image.image) {
            image.image = await preSigner(image, 'image')
          }
        }
      }

      return res.status(200).send(course)
    }

    const course = await courseModel
      .findOne({ _id: req.params.id, status: 'active' })
      .populate('mentors', ['fullName', 'profilePicture'])
      .populate('overviewLocation', ['locationName', 'address'])

    if (!course) {
      return res.status(404).send({ message: 'Course not found' })
    }

    if (course.courseThumbnail) {
      course.courseThumbnail = await preSigner(course, 'courseThumbnail')
    }

    if (course?.mentors) {
      for (let mentor of course.mentors) {
        if (mentor?.profilePicture) {
          mentor.profilePicture = await preSigner(mentor, 'profilePicture')
        }
      }
    }

    if (course?.benefits?.cards?.length > 0) {
      for (let card of course.benefits.cards) {
        if (card.icon) {
          card.icon = await preSigner(card, 'icon')
        }
      }
    }

    if (course?.courseOutcomes?.cards?.length > 0) {
      for (let card of course.courseOutcomes.cards) {
        if (card.icon) {
          card.icon = await preSigner(card, 'icon')
        }
      }
    }

    if (course?.eligibility?.cards?.length > 0) {
      for (let card of course.eligibility.cards) {
        if (card.icon) {
          card.icon = await preSigner(card, 'icon')
        }
      }
    }

    if (course?.careerPro?.cards?.length > 0) {
      for (let card of course.careerPro.cards) {
        if (card.icon) {
          card.icon = await preSigner(card, 'icon')
        }
      }
    }

    if (course?.modules?.length > 0) {
      for (let module of course.modules) {
        if (module.moduleIcon) {
          module.moduleIcon = await preSigner(module, 'moduleIcon')
        }
      }
    }

    if (course.testimonials.length > 0) {
      course.testimonials.forEach(async (file, index) => {
        course.testimonials[index] = await preSigner(course.testimonials, index)
      })
    }

    if (course.imageCarousel.length > 0) {
      for (let image of course.imageCarousel) {
        if (image.image) {
          image.image = await preSigner(image, 'image')
        }
      }
    }

    return res.status(200).send(course)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getCourseDetails = getCourseDetails

const filterCourses = async (req, res) => {
  try {
    const response = {}
    const requiredFields = [
      'courseName',
      'courseDuration',
      'basePrice',
      'sessionCount',
      'sessionDuration',
      'status',
      'URL',
      'courseThumbnail',
    ]
    const sessionDuration = req.query.sessionDuration
    const startPrice = parseInt(req.query.startPrice)
    const endPrice = parseInt(req.query.endPrice)
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    let findFilter = {}
    if (req.query.sessionDuration) {
      const curriculums = await curriculumModel.find({
        sessionDuration: parseInt(req.query.sessionDuration),
      })
      let course_set = new Set()
      for (let curriculum of curriculums) {
        course_set.add(curriculum.course)
      }
      let courseArray = Array.from(course_set)
      findFilter._id = { $in: courseArray }
    }
    if (req.query.startPrice && req.query.endPrice) {
      findFilter.basePrice = { $gte: startPrice, $lte: endPrice }
    }
    if (req.query.status) {
      findFilter.status = req.query.status
    }
    const totalCourses = await courseModel.find(findFilter).countDocuments()
    const totalPages = Math.ceil(totalCourses / limit)

    const courses = await courseModel
      .find(findFilter, requiredFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)

    for (let course of courses) {
      if (course.courseThumbnail) {
        course.courseThumbnail = await preSigner(course, 'courseThumbnail')
      }
      const latestCurriculum = await curriculumModel
        .find({ course: course._id })
        .sort({ createdAt: -1 })
        .limit(1)
      course._doc.latestVersion = latestCurriculum[0]?.version
      course._doc.sessionDuration = latestCurriculum[0]?.sessionDuration
    }

    response.courses = courses
    response.currentPage = page
    response.totalPages = totalPages
    response.totalCourses = totalCourses

    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.filterCourses = filterCourses

const createCurriculum = async (req, res) => {
  try {
    if (req.query.type === 'new') {
      const curriculumCount = await curriculumModel.countDocuments()
      const curriculum = new curriculumModel({
        course: req.params.id,
        modifierId: req.uid,
        version: curriculumCount + 1,
        ...req.body,
      })
      await curriculum.save()
      return res.status(200).send(curriculum)
    }
    if (req.query.type === 'duplicate') {
      const existingCurriculum = await curriculumModel.findOne({
        _id: req.query.curriculum,
      })
      if (!existingCurriculum) {
        return res.status(404).send('Existing curriculum not found')
      }

      const existingCurriculumJSON = existingCurriculum.toJSON()
      delete existingCurriculumJSON._id
      delete existingCurriculumJSON.id
      delete existingCurriculumJSON.version
      delete existingCurriculumJSON.modifierId
      const curriculumCount = await curriculumModel.countDocuments()
      const newCurriculum = new curriculumModel({
        version: curriculumCount + 1,
        ...existingCurriculumJSON,
      })
      await newCurriculum.save()

      const existingSessions = await sessionModel.find({
        curriculum: existingCurriculum._id,
      })
      for (let existingSession of existingSessions) {
        const sessionJSON = existingSession.toJSON()
        delete sessionJSON._id
        delete sessionJSON.id
        delete sessionJSON.curriculum
        if (sessionJSON.sessionType === 'Onboarding') {
          sessionJSON.sessionType = 'Onboarding'
          const newSession = new onboardingSessionModel({
            curriculum: newCurriculum._id.toString(),
            ...sessionJSON,
          })
          await newSession.save()
        }
        if (sessionJSON.sessionType === 'Evaluation') {
          sessionJSON.sessionType = 'Evaluation'
          const newSession = new evaluationSessionModel({
            curriculum: newCurriculum._id.toString(),
            ...sessionJSON,
          })
          await newSession.save()
        }
        if (sessionJSON.sessionType === 'Normal') {
          sessionJSON.sessionType = 'Normal'
          const newSession = new normalSessionModel({
            curriculum: newCurriculum._id.toString(),
            ...sessionJSON,
          })
          await newSession.save()
        }
      }
      return res.status(200).send(newCurriculum)
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.createCurriculum = createCurriculum

const getCurriculums = async (req, res) => {
  try {
    const course = await courseModel.findOne({ _id: req.params.id })
    if (!course) {
      return res.status(404).send('Course not found')
    }
    const curriculums = await curriculumModel.find({ course: req.params.id })
    for (let curriculum of curriculums) {
      curriculum._doc.courseDuration = course.courseDuration
      curriculum._doc.sessionCount = course.sessionCount
    }
    return res.status(200).send(curriculums)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getCurriculums = getCurriculums

const getOneCurriculum = async (req, res) => {
  try {
    const curriculum = await curriculumModel
      .findOne({
        _id: req.params.curriculumId,
        course: req.params.id,
      })
      .populate('modifiedBy')
    if (!curriculum) {
      return res.status(404).send({ message: 'Curriculum not found.' })
    }
    return res.status(200).send(curriculum)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOneCurriculum = getOneCurriculum

const updateCurriculum = async (req, res) => {
  try {
    const curriculum = await curriculumModel.findOne({
      _id: req.params.curriculumId,
    })
    if (!curriculum) {
      return res.status(404).send({ message: 'Curriculum not found.' })
    }
    const updates = Object.keys(req.body)

    for (let update of updates) {
      curriculum[update] = req.body[update]
    }
    curriculum.modifierId = req.uid
    await curriculum.save()
    return res.status(200).send(curriculum)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateCurriculum = updateCurriculum

const activateCurriculum = async (req, res) => {
  try {
    const curriculum = await curriculumModel.findOne({ _id: req.params.id })
    if (!curriculum) {
      return res.status(404).send({ message: 'curriculum not found' })
    }
    curriculum.status = 'active'
    await curriculum.save()
    return res.status(200).send(curriculum)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.activateCurriculum = activateCurriculum

const deactivateCurriculum = async (req, res) => {
  try {
    const curriculum = await curriculumModel.findOne({ _id: req.params.id })
    if (!curriculum) {
      return res.status(404).send({ message: 'curriculum not found' })
    }
    curriculum.status = 'inactive'
    await curriculum.save()
    return res.status(200).send(curriculum)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.deactivateCurriculum = deactivateCurriculum

const removeCurriculum = async (req, res) => {
  try {
    const curriculum = await curriculumModel.findOne({
      _id: req.params.curriculumId,
      course: req.params.id,
    })
    if (!curriculum) {
      return res.status(404).send({ message: 'Curriculum not found.' })
    }
    await sessionModel.deleteMany({
      curriculum: curriculum._id,
      course: curriculum.course,
    })
    await curriculum.remove()
    return res.status(200).send(curriculum)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.removeCurriculum = removeCurriculum

const createCurriculumSession = async (req, res) => {
  try {
    const curriculum = await curriculumModel.findOne({
      _id: req.params.curriculumId,
    })
    if (!curriculum) {
      return res.status(404).send({ message: 'Curriculum not found.' })
    }
    curriculum.modifierId = req.uid
    await curriculum.save()
    if (req.body.sessionType === 'Onboarding') {
      const session = new onboardingSessionModel({
        curriculum: req.params.curriculumId,
        course: req.params.id,
        ...req.body,
      })

      if (req.files.sessionIcon) {
        session.sessionIcon = req.files.sessionIcon[0].key
      }

      if (req.files.figmaDocument) {
        session.figmaDocument = req.files.figmaDocument[0].key
      }

      if (req.files.XDDocument) {
        session.XDDocument = req.files.XDDocument[0].key
      }
      await session.save()
      return res.status(200).send(session)
    }
    if (req.body.sessionType === 'Normal') {
      const session = new normalSessionModel({
        curriculum: req.params.curriculumId,
        course: req.params.id,
        ...req.body,
      })
      if (req.files.sessionIcon) {
        session.sessionIcon = req.files.sessionIcon[0].key
      }
      if (req.files?.document) {
        req.files.document.forEach((file, index) => {
          session.studyMaterial[index].document = file.key
        })
      }
      await session.save()
      return res.status(200).send(session)
    }
    if (req.body.sessionType === 'Evaluation') {
      const session = new evaluationSessionModel({
        curriculum: req.params.curriculumId,
        course: req.params.id,
        ...req.body,
      })
      if (req.files.sessionIcon) {
        session.sessionIcon = req.files.sessionIcon[0].key
      }
      if (req.files?.document) {
        req.files.document.forEach((file, index) => {
          session.studyMaterial[index].document = file.key
        })
      }
      if (req.files.activityDocument) {
        session.activityFile.document = req.files.activityDocument[0].key
      }
      if (req.files.certificateTemplate) {
        session.certificateTemplate = req.files.certificateTemplate[0].key
      }
      await session.save()
      return res.status(200).send(session)
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.createCurriculumSession = createCurriculumSession

const getCurriculumSessions = async (req, res) => {
  try {
    const requiredFields = ['sessionName', 'sessionType']
    const sessions = await sessionModel.find(
      { course: req.params.id, curriculum: req.params.curriculumId },
      requiredFields,
    )
    return res.status(200).send(sessions)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getCurriculumSessions = getCurriculumSessions

const getOneCurriculumSession = async (req, res) => {
  try {
    const session = await sessionModel.findOne({
      _id: req.params.sessionId,
      curriculum: req.params.curriculumId,
      course: req.params.id,
    })
    if (!session) {
      return res.status(404).send({ message: 'Session not found.' })
    }

    if (session.sessionIcon) {
      session.sessionIcon = await preSigner(session, 'sessionIcon')
    }

    if (session.sessionType === 'Onboarding') {
      if (session.figma?.figmaDocument) {
        session.figma.figmaDocument = await preSigner(
          session.figma,
          'figmaDocument',
        )
      }

      if (session.XD?.XDDocument) {
        session.XD.XDDocument = await preSigner(session.XD, 'XDDocument')
      }
    }
    if (
      session.sessionType === 'Normal' ||
      session.sessionType === 'Evaluation'
    ) {
      for (let studyMaterial of session.studyMaterial) {
        if (studyMaterial.document) {
          studyMaterial.document = await preSigner(studyMaterial, 'document')
        }
      }
    }
    if (session.sessionType === 'Evaluation') {
      if (session.activityFile.document) {
        session.activityFile.document = await preSigner(
          session.activityFile,
          'document',
        )
      }
      if (session.certificateTemplate) {
        session.certificateTemplate = await preSigner(
          session,
          'certificateTemplate',
        )
      }
    }
    return res.status(200).send(session)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOneCurriculumSession = getOneCurriculumSession

const updateCurriculumSession = async (req, res) => {
  try {
    const curriculum = await curriculumModel.findOne({
      _id: req.params.curriculumId,
    })
    if (!curriculum) {
      return res.status(404).send({ message: 'Curriculum not found.' })
    }
    curriculum.modifierId = req.uid
    await curriculum.save()
    const session = await sessionModel.findOne({
      _id: req.params.sessionId,
      curriculum: req.params.curriculumId,
    })
    if (!session) {
      return res.status(404).send('Session not found.')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      session[update] = req.body[update]
    }
    if (session.sessionType === 'Onboarding') {
      if (req.files.sessionIcon) {
        session.sessionIcon = req.files.sessionIcon[0].key
      }

      if (req.files.figmaDocument) {
        session.figmaDocument = req.files.figmaDocument[0].key
      }

      if (req.files.XDDocument) {
        session.XDDocument = req.files.XDDocument[0].key
      }
    }
    if (session.sessionType === 'Normal') {
      if (req.files.sessionIcon) {
        session.sessionIcon = req.files.sessionIcon[0].key
      }
      if (req.files?.document) {
        req.files.document.forEach((file, index) => {
          session.studyMaterial[index].document = file.key
        })
      }
    }
    if (session.sessionType === 'Evaluation') {
      if (req.files.sessionIcon) {
        session.sessionIcon = req.files.sessionIcon[0].key
      }
      if (req.files?.document) {
        req.files.document.forEach((file, index) => {
          session.studyMaterial[index].document = file.key
        })
      }
      if (req.files.activityDocument) {
        session.activityFile.document = req.files.activityDocument[0].key
      }
      if (req.files.certificateTemplate) {
        session.certificateTemplate = req.files.certificateTemplate[0].key
      }
    }
    await session.save()
    return res.status(200).send(session)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateCurriculumSession = updateCurriculumSession

const removeCurriculumSession = async (req, res) => {
  try {
    const session = await sessionModel.findOne({
      _id: req.params.sessionId,
      curriculum: req.params.curriculumId,
      course: req.params.id,
    })
    if (!session) {
      return res.status(404).send('Session not found.')
    }
    await session.remove()
    return res.status(200).send(session)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.removeCurriculumSession = removeCurriculumSession

const getCourseBatches = async (req, res) => {
  const id = req.params.courseId
  if (!id) {
    res.status(403).json({ msg: `please course provide a id` })
  }
  try {
    const course = await courseModel.findOne({ _id: id })
    if (!course) {
      return res.status(404).send({ message: 'Course not found.' })
    }
    const locations = await locationModel.find({ status: 'active' }, [
      'locationName',
      'locationImg',
    ])
    for (let location of locations) {
      const calendars = await calendarModel.find({
        locationId: location._id,
        type: 'batch',
      })
      const batchId_set = new Set()
      for (let calendar of calendars) {
        batchId_set.add(calendar.eventId)
      }
      const batchIds = Array.from(batchId_set)
      const batches = await batchModel.find(
        { _id: { $in: batchIds }, courseId: id, status: 'scheduled' },
        ['startDate', 'repeatEvery', 'repeatDays', 'endDate'],
      )
      if (location.locationImg) {
        location.locationImg = await preSigner(location, 'locationImg')
      }
      if (batches.length > 0) {
        location._doc.batches = batches
      }
    }
    res.status(200).send(locations)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getCourseBatches = getCourseBatches

const getFilterSessionDurations = async (req, res) => {
  try {
    const curriculums = await curriculumModel.find({}, ['sessionDuration'])
    let sessionDurationSet = new Set()
    for (let curriculum of curriculums) {
      if (curriculum.sessionDuration) {
        sessionDurationSet.add(curriculum.sessionDuration)
      }
    }
    let sessionDurations = Array.from(sessionDurationSet)
    res.status(200).send({ sessionDurations })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getFilterSessionDurations = getFilterSessionDurations

const getEnrolledCourses = async (req, res) => {
  try {
    const response = {}
    response.enrolledCourse = []
    response.lockedCourse = []
    const lCourse = await transactionModel.find({
      madeById: req.uid,
      transactionType: 'Course',
      status: 'successful',
      paymentMode: 'neevFinance',
    })
    for (let transaction of lCourse) {
      const batch = await batchModel
        .findOne({ _id: transaction.batch }, [
          'batchCode',
          'curriculumId',
          'primaryMentorId',
          'endDate',
          'courseId',
        ])
        .populate('primaryMentor', ['fullName', 'profilePicture'])

      if (batch) {
        lockedCourse = {}
        lockedCourse.assignments = 0
        if (batch?.primaryMentor?.profilePicture) {
          batch.primaryMentor.profilePicture = await preSigner(
            batch.primaryMentor,
            'profilePicture',
          )
        }
        if (transaction?.product?.courseThumbnail) {
          transaction.product.courseThumbnail = await preSigner(
            transaction.product,
            'courseThumbnail',
          )
        }

        const sessionsCount = await batchSessionModel
          .find({ curriculum: batch.curriculumId, batch: batch._id })
          .countDocuments()
        const batchSessions = await batchSessionModel
          .find({
            curriculum: batch.curriculumId,
            batch: batch._id,
          })
          .populate('session')
        for (let batchSession of batchSessions) {
          if (
            (batchSession?.session?.sessionType === 'Evaluation' ||
              batchSession?.session?.sessionType === 'Normal') &&
            batchSession?.session?.assignments?.length > 0
          ) {
            lockedCourse.assignments =
              lockedCourse.assignments + batchSession.session.assignments.length
          }
        }
        const userSession = await userSessionMapModel.findOne({
          userId: req.uid,
          batch: batch._id,
          curriculum: batch.curriculumId,
          course: batch.courseId,
          sessionType: 'Onboarding',
        })
        lockedCourse.course = transaction.product
        lockedCourse.batch = batch
        lockedCourse.location = transaction.location
        lockedCourse.totalSessions = sessionsCount
        lockedCourse.onboardingCompleted = userSession?.status == 'completed'
        lockedCourse.locked = false
        // if(transaction.paymentMode == 'neevFinance'){
        //   const kyc = await kycModel.findOne({uid: req.uid})
        //   if(!kyc){
        //     enrolledCourse.locked = true
        //   }
        // }
        response.lockedCourse.push(lockedCourse)
      }
    }
    const transactions = await transactionModel
      .find({
        madeById: req.uid,
        transactionType: 'Course',
        status: 'successful',
      })
      .populate('product', ['courseName', 'courseCode', 'courseThumbnail'])
      .populate('location', 'locationName')
    for (let transaction of transactions) {
      const batch = await batchModel
        .findOne({ _id: transaction.batch }, [
          'batchCode',
          'curriculumId',
          'primaryMentorId',
          'endDate',
          'courseId',
        ])
        .populate('primaryMentor', ['fullName', 'profilePicture'])

      if (batch) {
        enrolledCourse = {}
        enrolledCourse.assignments = 0
        if (batch?.primaryMentor?.profilePicture) {
          batch.primaryMentor.profilePicture = await preSigner(
            batch.primaryMentor,
            'profilePicture',
          )
        }
        if (transaction?.product?.courseThumbnail) {
          transaction.product.courseThumbnail = await preSigner(
            transaction.product,
            'courseThumbnail',
          )
        }

        const sessionsCount = await batchSessionModel
          .find({ curriculum: batch.curriculumId, batch: batch._id })
          .countDocuments()
        const batchSessions = await batchSessionModel
          .find({
            curriculum: batch.curriculumId,
            batch: batch._id,
          })
          .populate('session')
        for (let batchSession of batchSessions) {
          if (
            (batchSession?.session?.sessionType === 'Evaluation' ||
              batchSession?.session?.sessionType === 'Normal') &&
            batchSession?.session?.assignments?.length > 0
          ) {
            enrolledCourse.assignments =
              enrolledCourse.assignments +
              batchSession.session.assignments.length
          }
        }
        const userSession = await userSessionMapModel.findOne({
          userId: req.uid,
          batch: batch._id,
          curriculum: batch.curriculumId,
          course: batch.courseId,
          sessionType: 'Onboarding',
        })
        enrolledCourse.course = transaction.product
        enrolledCourse.batch = batch
        enrolledCourse.location = transaction.location
        enrolledCourse.totalSessions = sessionsCount
        enrolledCourse.onboardingCompleted = userSession?.status == 'completed'
        enrolledCourse.locked = false
        // if(transaction.paymentMode == 'neevFinance'){
        //   const kyc = await kycModel.findOne({uid: req.uid})
        //   if(!kyc){
        //     enrolledCourse.locked = true
        //   }
        // }
        response.enrolledCourse.push(enrolledCourse)
      }
    }
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getEnrolledCourses = getEnrolledCourses

const getEnrolledCourseOnboarding = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      productId: req.params.id,
      madeById: req.uid,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res
        .status(404)
        .send({ message: 'You need to enroll in the course first.' })
    }
    const batch = await batchModel.findOne({ _id: transaction.batch })
    if (!batch) {
      return res.status(404).send({ message: 'Batch not found.' })
    }

    const session = await sessionModel.findOne({
      curriculum: batch.curriculumId,
      sessionType: 'Onboarding',
    })
    const onboardingSession = await batchSessionModel
      .findOne({
        curriculum: batch.curriculumId,
        batch: batch._id,
        session: session._id,
      })
      .populate({ path: 'session', populate: { path: 'problemBriefs' } })

    if (onboardingSession?.session?.figma?.figmaDocument) {
      onboardingSession.session.figma.figmaDocument = await preSigner(
        onboardingSession.session.figma,
        'figmaDocument',
      )
    }
    if (onboardingSession?.XD?.XDDocument) {
      onboardingSession.session.XD.XDDocument = await preSigner(
        onboardingSession.session.XD,
        'XDDocument',
      )
    }
    if (onboardingSession?.session?.problemBriefs) {
      for (let problemBrief of onboardingSession.session.problemBriefs) {
        if (problemBrief?.thumbnail) {
          problemBrief.thumbnail = await preSigner(problemBrief, 'thumbnail')
        }
      }
    }

    return res.status(200).send(onboardingSession)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getEnrolledCourseOnboarding = getEnrolledCourseOnboarding

const submitCourseOnboarding = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      productId: req.params.id,
      madeById: req.uid,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res
        .status(404)
        .send({ message: 'You need to enroll in the course first.' })
    }
    const batch = await batchModel.findOne({ _id: transaction.batch })
    if (!batch) {
      return res.status(404).send({ message: 'Batch not found.' })
    }
    const session = await sessionModel.findOne({
      curriculum: batch.curriculumId,
      sessionType: 'Onboarding',
    })
    const onboardinSession = await batchSessionModel.findOne({
      curriculum: batch.curriculumId,
      batch: batch._id,
      session: session._id,
    })
    if (!onboardinSession) {
      return res.status(404).send({ message: 'Session not found.' })
    }
    const userSession = new userSessionMapModel({
      userId: req.uid,
      batch: transaction.batch,
      session: onboardinSession._id,
      curriculum: onboardinSession.curriculum,
      sessionType: onboardinSession.sessionType,
      course: onboardinSession.course,
      sessionType: 'Onboarding',
      ...req.body,
    })
    if (req.body.onboardingCompleted == true) {
      userSession.status = 'completed'
    }
    await userSession.save()
    return res.status(200).send(userSession)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.submitCourseOnboarding = submitCourseOnboarding

const updateCourseOnboarding = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      productId: req.params.id,
      madeById: req.uid,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res
        .status(404)
        .send({ message: 'You need to enroll in the course first.' })
    }
    const batch = await batchModel.findOne({ _id: transaction.batch })
    if (!batch) {
      return res.status(404).send({ message: 'Batch not found.' })
    }
    const session = await sessionModel.findOne({
      curriculum: batch.curriculumId,
      sessionType: 'Onboarding',
    })
    const onboardinSession = await batchSessionModel.findOne({
      curriculum: batch.curriculumId,
      batch: batch._id,
      session: session._id,
    })
    if (!onboardinSession) {
      return res.status(404).send({ message: 'Session not found.' })
    }
    const userSession = await userSessionMapModel.findOne({
      userId: req.uid,
      session: onboardinSession._id,
    })
    if (!userSession) {
      return res.status(404).send({ message: 'User session not found.' })
    }
    userSession.problemBriefs = req.body.problemBriefs
    if (req.body.onboardingCompleted == true) {
      userSession.status = 'completed'
    }
    await userSession.save()
    return res.status(200).send(userSession)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.updateCourseOnboarding = updateCourseOnboarding

const getAllEnrolledSessions = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      productId: req.params.id,
      madeById: req.uid,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res
        .status(404)
        .send({ message: 'You need to enroll in the course first.' })
    }
    const batch = await batchModel.findOne({ _id: transaction.batch })
    if (!batch) {
      return res.status(404).send({ message: 'Batch not found.' })
    }
    const sessions = await batchSessionModel
      .find({ curriculum: batch.curriculumId, batch: batch._id }, ['_id'])
      .populate('session', ['sessionName', 'sessionType'])
    return res.status(200).send(sessions)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getAllEnrolledSessions = getAllEnrolledSessions

const getEnrolledSession = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({
      productId: req.params.id,
      madeById: req.uid,
      transactionType: 'Course',
      status: 'successful',
    })
    if (!transaction) {
      return res
        .status(404)
        .send({ message: 'You need to enroll in the course first.' })
    }
    const batchSession = await batchSessionModel
      .findOne(
        {
          _id: req.params.sessionId,
          batch: transaction.batch,
          course: req.params.id,
        },
        ['_id', 'session', 'curriculum', 'batch', 'course'],
      )
      .populate('session')
    if (!batchSession) {
      return res.status(404).send({ message: 'Session not found.' })
    }
    if (batchSession?.session?.sessionIcon) {
      batchSession.session.sessionIcon = await preSigner(
        batchSession.session,
        'sessionIcon',
      )
    }

    if (batchSession.session.sessionType === 'Onboarding') {
      if (batchSession?.session.figma?.figmaDocument) {
        batchSession.session.figma.figmaDocument = await preSigner(
          batchSession.session.figma,
          'figmaDocument',
        )
      }

      if (batchSession?.session.XD?.XDDocument) {
        batchSession.session.XD.XDDocument = await preSigner(
          batchSession.session.XD,
          'XDDocument',
        )
      }
    }
    if (
      batchSession.session.sessionType === 'Normal' ||
      batchSession.session.sessionType === 'Evaluation'
    ) {
      for (let studyMaterial of batchSession.session.studyMaterial) {
        if (studyMaterial.document) {
          studyMaterial.document = await preSigner(studyMaterial, 'document')
        }
      }
    }
    if (batchSession.session.sessionType === 'Evaluation') {
      if (batchSession.session.activityFile.document) {
        batchSession.session.activityFile.document = await preSigner(
          batchSession.session.activityFile,
          'document',
        )
      }
      if (batchSession.session.certificateTemplate) {
        batchSession.session.certificateTemplate = await preSigner(
          batchSession.session,
          'certificateTemplate',
        )
      }
    }
    return res.status(200).send(batchSession)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getEnrolledSession = getEnrolledSession
