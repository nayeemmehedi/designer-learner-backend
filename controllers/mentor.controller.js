const userModel = require('../models/user.model')
const courseModel = require('../models/course.model')
const batchModel = require('../models/batch.model')
const sessionModel = require('../models/session.model').Session
const calendarModel = require('../models/calendar.model')
const userSessionMapModel = require('../models/userSessionmap.model')
const batchSessionModel = require('../models/batchSession.model')

const preSigner = require('../utils/urlGenerator.util')

const getAllAssignedCourses = async (req, res) => {
  try{
    const requiredFields = [
      'batchCode',
      'courseId',
      'curriculumId',
      'primaryMentorId',
      'status',
      'endDate',
    ]
    const batches = await batchModel
      .find({ 
        primaryMentorId: req.uid, 
        status: 'scheduled'}, 
        requiredFields
      )
      .populate('courseId', ['courseName', 'courseCode', 'courseThumbnail'])
    for(let batch of batches){
      const userSessionMap = await userSessionMapModel.findOne({
        userId: req.uid,
        batch: batch._id,
        sessionType: 'BatchOnboarding',
        curriculum: batch.curriculumId,
        course: batch.courseId._id,
      })
      if(batch?.courseId?.courseThumbnail){
        batch.courseId.courseThumbnail = await preSigner(batch.courseId, 'courseThumbnail')
      }
      batch._doc.totalSessions = await batchSessionModel.countDocuments({ 
        curriculum: batch.curriculumId,
        batch: batch._id, 
      })
      batch._doc.locations = await calendarModel
        .find({ batch: batch._id })
        .distinct('locationId')
        .populate('locationId', ['locationName', 'locationCode'])
      batch._doc.onboardingCompleted = userSessionMap?.status == 'completed'
    }
    return res.status(200).send(batches)
  }catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAllAssignedCourses = getAllAssignedCourses

const getAssignedCourseOnboarding = async (req, res) => {
  try{
    const batch = await batchModel.findOne({ _id: req.params.id, primaryMentorId: req.uid })
    if(!batch){
      return res.status(404).send('You are not assigned to this course')
    }
    const session = await sessionModel.findOne({curriculum: batch.curriculumId, sessionType: 'Onboarding'})
    const onboardingSession = await batchSessionModel.findOne({ 
      curriculum: batch.curriculumId,
      batch: batch._id, 
      session: session._id,
    }).populate('session')
    if(!onboardingSession){
      return res.status(404).send('Onboarding session not found')
    }
    if(onboardingSession?.session?.figma?.figmaDocument){
      onboardingSession.session.figma.figmaDocument = await preSigner(onboardingSession.session.figma, 'figmaDocument')
    }
    if(onboardingSession?.session?.XD?.XDDocument){
      onboardingSession.session.XD.XDDocument = await preSigner(onboardingSession.session.XD, 'XDDocument')
    }
    return res.status(200).send(onboardingSession)
  }catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAssignedCourseOnboarding = getAssignedCourseOnboarding

const submitCourseOnboarding = async (req, res) => {
  try{
    const batch = await batchModel.findOne({ _id: req.params.id, primaryMentorId: req.uid })
    if(!batch){
      return res.status(404).send('You are not assigned to this course')
    }
    const session = await sessionModel.findOne({curriculum: batch.curriculumId, sessionType: 'Onboarding'})
    const onboardingSession = await batchSessionModel.findOne({ 
      curriculum: batch.curriculumId, 
      batch: batch._id,
      session: session._id,
    }).populate('session')
    const userSession = new userSessionMapModel({
      userId: req.uid,
      batch: batch._id,
      session: onboardingSession._id,
      curriculum: batch.curriculumId,
      course: batch.courseId,
      sessionType: 'Onboarding',
      ...req.body,
    })
    if(req.body.onboardingCompleted == true){
      userSession.status = 'completed'
    }
    await userSession.save()
    return res.status(200).send(userSession)
  } catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.submitCourseOnboarding = submitCourseOnboarding

const updateCourseOnboarding = async (req, res) => {
  try{
    const batch = await batchModel.findOne({ _id: req.params.id, primaryMentorId: req.uid })
    if(!batch){
      return res.status(404).send('You are not assigned to this course')
    }
    const onboardingSession = await sessionModel.findOne({ 
      curriculum: batch.curriculumId,
      batch: batch._id, 
      sessionType: 'BatchOnboarding' 
    })
    const userSession = await userSessionMapModel.findOne({
      userId: req.uid,
      batch: batch._id,
      session: onboardingSession._id,
      curriculum: batch.curriculumId,
      course: batch.courseId,
      sessionType: 'BatchOnboarding',
    })
    if(!userSession){
      return res.status(404).send('Onboarding session not found')
    }
    const updates = Object.keys(req.body)
    updates.forEach(update => userSession[update] = req.body[update])
    if(req.body.onboardingCompleted == true){
      userSession.status = 'completed'
    }
    await userSession.save()
    return res.status(200).send(userSession)
  } catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
} 

module.exports.updateCourseOnboarding = updateCourseOnboarding

const getAllAssignedBatchSessions = async (req, res) => {
  try{
    const batch = await batchModel.findOne({ _id: req.params.id })
    if(!batch){
      return res.status(404).send('Batch not found')
    }
    const sessions = await batchSessionModel.find({ 
      curriculum: batch.curriculumId,
      batch: batch._id, 
    }).populate('session', ['sessionType', 'sessionName'])
    return res.status(200).send(sessions)
  }catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAllAssignedBatchSessions = getAllAssignedBatchSessions

const getSessionDetails = async (req, res) => {
  try{
    const batchSession = await batchSessionModel.findOne({ _id: req.params.sessionId }).populate('session')
    if(!batchSession){
      return res.status(404).send('Session not found')
    }
    if (batchSession.session.sessionIcon) {
      batchSession.session.sessionIcon = await preSigner(batchSession.session, 'sessionIcon')
    }

    if (batchSession.session.sessionType === 'Onboarding') {
      if (batchSession.session.figma?.figmaDocument) {
        batchSession.session.figma.figmaDocument = await preSigner(
          batchSession.session.figma,
          'figmaDocument',
        )
      }

      if (batchSession.session.XD?.XDDocument) {
        batchSession.session.XD.XDDocument = await preSigner(batchSession.session.XD, 'XDDocument')
      }
    }
    if (
      batchSession.session.sessionType === 'Normal' ||
      batchSession.session.sessionType === 'Evaluation'
    ) {
      for(let studyMaterial of batchSession.session.studyMaterial){
        if(studyMaterial.document){
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
  }catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getSessionDetails = getSessionDetails
