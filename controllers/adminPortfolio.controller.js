const adminPortfolioModel = require('../models/adminPortfolio.model')
const pageModel = require('../models/page.model')

const preSigner = require('../utils/urlGenerator.util')

const getAdminPortfolio = async (req, res) => {
  const id = req.params.id
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit

    const adminPortfolio = await adminPortfolioModel
      .find({ _id: id })
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
    return res.status(200).json(adminPortfolio)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const getAllAdminPortfolio = async (req, res) => {
  try {
    let response = {}
    response.portfolios = []
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit

    const adminPortfolios = await adminPortfolioModel
      .find({})
      .populate('addedBy', ['fullName', 'profilePicture'])
      .populate({
        path: 'caseStudy',
        select: ['uid', 'tittle', 'learner'],
        populate: { path: 'learner', select: ['fullName', 'profilePicture'] },
      })
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
    const totatlPortfolios = await adminPortfolioModel.find({}).countDocuments()
    const totalPages = Math.ceil(totatlPortfolios / limit)
    const currentPage = page
    for (let adminPortfolio of adminPortfolios) {
      adminPortfolio = adminPortfolio.toJSON()
      if (adminPortfolio?.addedBy?.profilePicture) {
        adminPortfolio.addedBy.profilePicture = await preSigner(
          adminPortfolio.addedBy,
          'profilePicture',
        )
      }
      if (adminPortfolio?.caseStudy?.learner?.profilePicture) {
        adminPortfolio.caseStudy.learner.profilePicture = await preSigner(
          adminPortfolio.caseStudy.learner,
          'profilePicture',
        )
      }
      response.portfolios.push(adminPortfolio)
    }
    const portfolioIds = await adminPortfolioModel.find({}).distinct('_id')
    const existingPage = await pageModel
      .findOne({ adminPortfolios: { $in: portfolioIds } }, [
        'pageUrl',
        'status',
        'modifierId',
      ])
      .populate('modifiedBy')
    if (existingPage?.modifiedBy?.profilePicture) {
      existingPage.modifiedBy.profilePicture = await preSigner(
        existingPage.modifiedBy,
        'profilePicture',
      )
    }
    const totalActive = await adminPortfolioModel
      .find({ status: 'active' })
      .countDocuments()
    const totalInactive = await adminPortfolioModel
      .find({ status: 'inactive' })
      .countDocuments()
    response.webPageSettings = existingPage ? existingPage : {}
    response.totalActive = totalActive
    response.totalInactive = totalInactive
    response.totalPortfolios = totatlPortfolios
    response.totalPages = totalPages
    response.currentPage = currentPage
    return res.status(200).json(response)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const deleteAdminPortfolio = async (req, res) => {
  const id = req.params.id
  try {
    const adminPortfolio = await adminPortfolioModel.deleteOne({ _id: id })
    return res.status(200).json(adminPortfolio)
  } catch (error) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const addAdminPortfolio = async (req, res) => {
  try {
    const addedById = req.uid
    const body = { addedById, ...req.body }
    const portfolioIds = await adminPortfolioModel.find({}).distinct('_id')
    const existingPage = await pageModel.findOne({
      adminPortfolios: { $in: portfolioIds },
    })
    const existingPortfolio = await adminPortfolioModel.findOne({
      caseStudy: body.caseStudy,
    })
    if (existingPortfolio) {
      return res
        .status(400)
        .json({ message: 'CaseStudy already exists in portfolio.' })
    }
    const adminPortfolio = await adminPortfolioModel.create(body)
    if (!existingPage) {
      const page = new pageModel({
        title: 'Portfolio',
        pageType: 'dynamic',
        adminPortfolios: portfolioIds,
      })
      await page.save()
    }
    return res.status(200).json(adminPortfolio)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const updateAdminPortfolio = async (req, res) => {
  const id = req.params.id
  try {
    const adminPortfolio = await adminPortfolioModel.findOne({ _id: id })

    let updates = Object.keys(req.body)
    for (let update of updates) {
      adminPortfolio[update] = req.body[update]
    }
    await adminPortfolio.save()
    res.status(200).json(adminPortfolio)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const adminPortfolioWebPageSettings = async (req, res) => {
  try {
    const portfolioIds = await adminPortfolioModel.find({}).distinct('_id')
    const existingPage = await pageModel.findOne({
      adminPortfolios: { $in: portfolioIds },
    })
    if (existingPage) {
      const updates = Object.keys(req.body)
      for (let update of updates) {
        existingPage[update] = req.body[update]
      }
      existingPage.modifierId = req.uid
      await existingPage.save()
    }
    const page = new pageModel({
      title: 'Portfolio',
      pageType: 'dynamic',
      adminPortfolios: portfolioIds,
      pageUrl: req.body.pageUrl,
      status: req.body.status,
      modifierId: req.uid,
    })
    await page.save()
    return res.status(200).json(page)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.adminPortfolioWebPageSettings = adminPortfolioWebPageSettings

const adminPortfolioFilter = async (req, res) => {
  try {
    const filter = {}
    const response = {}
    response.portfolios = []
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit

    if (req.query.status) {
      filter.status = req.query.status
    }
    const adminPortfolios = await adminPortfolioModel
      .find(filter)
      .populate('addedBy', ['fullName', 'profilePicture'])
      .populate({
        path: 'caseStudy',
        select: ['uid', 'tittle', 'learner'],
        populate: { path: 'learner', select: ['fullName', 'profilePicture'] },
      })
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
    const totatlPortfolios = await adminPortfolioModel.find({}).countDocuments()
    const totalPages = Math.ceil(totatlPortfolios / limit)
    const currentPage = page
    for (let adminPortfolio of adminPortfolios) {
      adminPortfolio = adminPortfolio.toJSON()
      if (adminPortfolio?.addedBy?.profilePicture) {
        adminPortfolio.addedBy.profilePicture = await preSigner(
          adminPortfolio.addedBy,
          'profilePicture',
        )
      }
      if (adminPortfolio?.caseStudy?.learner?.profilePicture) {
        adminPortfolio.caseStudy.learner.profilePicture = await preSigner(
          adminPortfolio.caseStudy.learner,
          'profilePicture',
        )
      }
      response.portfolios.push(adminPortfolio)
    }
    const totalActive = await adminPortfolioModel
      .find({ status: 'active' })
      .countDocuments()
    const totalInactive = await adminPortfolioModel
      .find({ status: 'inactive' })
      .countDocuments()
    response.totalActive = totalActive
    response.totalInactive = totalInactive
    response.totalPortfolios = totatlPortfolios
    response.totalPages = totalPages
    response.currentPage = currentPage
    return res.status(200).json(response)
  } catch (e) {}
}

module.exports.adminPortfolioFilter = adminPortfolioFilter

module.exports = {
  addAdminPortfolio,
  deleteAdminPortfolio,
  getAdminPortfolio,
  updateAdminPortfolio,
  getAllAdminPortfolio,
  adminPortfolioWebPageSettings,
  adminPortfolioFilter,
}
