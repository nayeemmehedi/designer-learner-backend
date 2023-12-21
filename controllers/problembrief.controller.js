const probBriefModel = require('../models/problembrief.model')
const preSigner = require('../utils/urlGenerator.util')

const createProbBrief = async (req, res) => {
  try {
    const body = { ...req.body }
    console.log(req.body)
    const ProbBrief = await probBriefModel.create(body)
    res.status(200).json(ProbBrief)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.createProbBrief = createProbBrief

const deleteProbBrief = async (req, res) => {
  const id = req.params.id
  try {
    const ProbBrief = await probBriefModel.deleteOne({ _id: id })
    res.status(200).json(ProbBrief)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.deleteProbBrief = deleteProbBrief

const getProbBrief = async (req, res) => {
  const id = req.params.id
  try {
    const ProbBrief = await probBriefModel.findOne({ _id: id }).populate('courses', 'courseName')
    if (!ProbBrief) {
      return res.status(404).send('problem brief not found.')
    }
    if(ProbBrief?.thumbnail){
      ProbBrief.thumbnail = await preSigner(ProbBrief, 'thumbnail')
    }
    res.status(200).json(ProbBrief)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getProbBrief = getProbBrief

const updateProbBrief = async (req, res) => {
  const id = req.params.id
  try {
    const ProblemBrief = await probBriefModel.findOne({ _id: id })
    if (!ProblemBrief) {
      return res.status(404).send('problemBrief not found.')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      ProblemBrief[update] = req.body[update]
    }
    await ProblemBrief.save()
    res.status(200).json(ProblemBrief)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.updateProbBrief = updateProbBrief

const getAllBrief = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skipIndex = (page - 1) * limit
  try {
    const requiredFields = [
      'title',
      'domain',
      'courses',
      'domain',
      'status',
    ]
    const ProbBrief = await probBriefModel
      .find({}, requiredFields)
      .populate('courses', 'courseName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
    return res.status(200).json(ProbBrief)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAllProbBrief = getAllBrief
