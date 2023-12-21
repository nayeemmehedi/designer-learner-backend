const promotionModel = require('../models/promotion.model')

const createPromotion = async (req, res) => {
  try {
    if (req.body.promotionType === 'coupon') {
      const existingCoupon = await promotionModel.findOne({
        promotionType: 'coupon',
        couponCode: req.body.couponCode,
      })
      if (existingCoupon) {
        return res.status(400).send('Coupon code already exists')
      }
    }
    const promotion = new promotionModel({
      ...req.body,
    })
    await promotion.save()
    return res.status(200).send(promotion)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.createPromotion = createPromotion

const getAllPromotions = async (req, res) => {
  try {
    const response = {}
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    const requiredFields = [
      'name',
      'promotionType',
      'couponCode',
      'discount',
      'courses',
      'startDate',
      'endDate',
      'status',
      'discountType',
    ]
    const totalPromotions = await promotionModel.countDocuments()
    const totalPages = Math.ceil(totalPromotions / limit)
    const promotions = await promotionModel
      .find({}, requiredFields)
      .populate('courses', ['courseName'])
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
    response.promotions = promotions
    response.totalPromotions = totalPromotions
    response.totalPages = totalPages
    response.currentPage = page
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAllPromotions = getAllPromotions

const getOnePromotion = async (req, res) => {
  try {
    const promotion = await promotionModel
      .findOne({ _id: req.params.id })
      .populate('courses', ['courseName'])
    if (!promotion) {
      return res.status(404).send('Promotion not found')
    }
    return res.status(200).send(promotion)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOnePromotion = getOnePromotion

const updatePromotion = async (req, res) => {
  try {
    const promotion = await promotionModel.findOne({ _id: req.params.id })
    if (!promotion) {
      return res.status(404).send('Promotion not found')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      promotion[update] = req.body[update]
    }
    await promotion.save()
    return res.status(200).send(promotion)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updatePromotion = updatePromotion

const deletePromotion = async (req, res) => {
  try {
    const promotion = await promotionModel.findOne({ _id: req.params.id })
    if (!promotion) {
      return res.status(404).send('Promotion not found')
    }
    await promotion.remove()
    return res.status(200).send(promotion)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.deletePromotion = deletePromotion

const filterPromotions = async (req, res) => {
  try {
    const filter = {}
    const response = {}
    if (req.query.type) {
      filter.promotionType = req.query.type
    }
    if (req.query.status) {
      filter.status = req.query.status
    }
    if (req.query.applicableTo) {
      const courseList = req.query.applicableTo.split(',')
      filter.courses = { $in: courseList }
    }
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    const requiredFields = [
      'name',
      'promotionType',
      'couponCode',
      'discount',
      'courses',
      'endDate',
      'status',
    ]
    const totalPromotions = await promotionModel.find(filter).countDocuments()
    const totalPages = Math.ceil(totalPromotions / limit)
    const promotions = await promotionModel
      .find(filter, requiredFields)
      .populate('courses', ['courseName'])
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(limit)
    response.promotions = promotions
    response.totalPromotions = totalPromotions
    response.totalPages = totalPages
    response.currentPage = page
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.filterPromotions = filterPromotions

const getPromotionBycourse = async (req, res) => {
  try {
    const courseId = req.params.id
    const response = {}
    const requiredFields = [
      'name',
      'promotionType',
      'couponCode',
      'discount',
      'courses',
      'startDate',
      'endDate',
      'status',
      'discountType',
    ]
    const promotions = await promotionModel
      .find({ courses: courseId }, requiredFields)
      .populate('courses', ['courseName'])
      .sort({ createdAt: -1 })
    response.promotions = promotions
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getPromotionBycourse = getPromotionBycourse
