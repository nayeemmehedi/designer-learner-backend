const CaseStudiesModel = require('../models/caseStudies.model')

const preSigner = require('../utils/urlGenerator.util')

const getAllStudyCases = async (req, res) => {
  const uid = req.uid
  try {
    const requiredFiles = ['tittle', 'thumbnail', 'status', 'tags', 'fileType']
    const caseStudies = await CaseStudiesModel.find({ uid }, requiredFiles)
    res.status(200).json(caseStudies)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const createCaseStudies = async (req, res) => {
  const uid = req.uid
  try {
    const body = { uid, ...req.body }
    const caseStudies = await CaseStudiesModel.create(body)
    res.status(200).json(caseStudies)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const updateCaseStudies = async (req, res) => {
  const uid = req.uid
  const id = req.params.id
  try {
    const caseStudies = await CaseStudiesModel.findOne({ _id: id, uid })
    if (!caseStudies) {
      return res.status(404).send('caseStudy not found')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      caseStudies[update] = req.body[update]
    }
    await caseStudies.save()
    res.status(200).json(caseStudies)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const deleteCaseStudies = async (req, res) => {
  const uid = req.uid
  const id = req.params.id
  try {
    const caseStudies = await CaseStudiesModel.deleteOne({ uid, _id: id })
    res.status(200).json(caseStudies)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const getOneCaseStudies = async (req, res) => {
  try {
    const id = req.params.id
    const caseStudies = await CaseStudiesModel.findOne({ _id: id })
    res.status(200).json(caseStudies)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const getAllCaseStudiesForAdmin = async (req, res) => {
  try{
    const response = []
    const caseStudies = await CaseStudiesModel.find({}).populate('learner', ['uid', 'fullName', 'profilePicture'])
    for(let caseStudy of caseStudies){
      caseStudy = caseStudy.toJSON()
      if(caseStudy?.learner?.profilePicture){
        caseStudy.learner.profilePicture = await preSigner(caseStudy.learner, 'profilePicture')
      }
      response.push(caseStudy)
    }
    return res.status(200).json(response)
  } catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports = {
  createCaseStudies,
  deleteCaseStudies,
  getAllStudyCases,
  getOneCaseStudies,
  updateCaseStudies,
  getAllCaseStudiesForAdmin,
}
