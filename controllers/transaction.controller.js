const transactionModel = require('../models/transaction.model')
const preSigner = require('../utils/urlGenerator.util')
const CONFIG = require('../config/config')
const Razorpay = require('razorpay')
const promotionModel = require('../models/promotion.model')
const courseModel = require('../models/course.model')
const verifyPayment = require('../utils/paymentVerify.util')
const instance = new Razorpay({
  key_id: CONFIG.RAZOR_PAY_KEY_ID,
  key_secret: CONFIG.RAZOR_PAY_PRIVATE_KEY,
})

const initiatePayment = async (req, res) => {
  try {
    const existingTransaction = await transactionModel.findOne({
      productId: req.body.productId,
      madeById: req.uid,
      status: 'successful',
    })
    if (existingTransaction) {
      return res.status(400).send('Course already purchased')
    }
    const { transactionType, productId, couponCode } = req.body
    if (transactionType == 'Course') {
      const { basePrice } = await courseModel.findOne({ _id: productId })
      let amount = basePrice * 100
      if (req.body.couponCode) {
        const { discountType, discount, status } = await promotionModel.findOne(
          {
            couponCode: couponCode,
          },
        )
        if (!discount) {
          return res.status(404).send('invalid coupoun code')
        }
        if (status == 'active') {
          if (discountType == 'amount') {
            amount = basePrice - discount
          } else {
            amount = (basePrice * discount) / 100
          }
        }
      }
      let options = {
        amount: amount,
        currency: 'INR',
        receipt: 'order_rcptid_11',
      }
      const transaction = new transactionModel({
        madeById: req.uid,
        amount: amount,
        status: 'rpending',
        ...req.body,
      })

      let order = {}
      await instance.orders.create(options, function (err, Order) {
        transaction['orderId'] = Order.id
        order.detials = Order
      })
      await transaction.save()
      return res
        .status(201)
        .json({ order: order.detials, amount, transactionId: transaction._id })
    }
    res.status(200).send('the logic was not yet implemented')
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}
module.exports.initiatTransaction = initiatePayment
const addTransaction = async (req, res) => {
  try {
    const existingTransaction = await transactionModel.findOne({
      productId: req.body.productId,
      madeById: req.uid,
      status: 'successful',
    })
    if (existingTransaction) {
      return res.status(400).send('Course already purchased')
    }

    const transaction = new transactionModel({
      madeById: req.uid,
      ...req.body,
    })
    await transaction.save()
    return res.status(200).send(transaction)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.addTransaction = addTransaction

const getAllTransactions = async (req, res) => {
  try {
    const response = {}
    const requiredFields = [
      'transactionType',
      'amount',
      'status',
      'productId',
      'paymentMode',
      'transactionId',
      'madeById',
      'createdAt',
    ]
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const totalTransactions = await transactionModel.countDocuments()
    const totalPages = Math.ceil(totalTransactions / limit)
    const transactions = await transactionModel
      .find({}, requiredFields)
      .populate('product', ['courseName', 'courseThumbnail'])
      .populate('madeBy', ['fullName', 'profilePicture'])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    let transactionArray = []
    for (let transaction of transactions) {
      let transactionJSON = transaction.toJSON()
      if (transactionJSON?.madeBy?.profilePicture) {
        transactionJSON.madeBy.profilePicture = await preSigner(
          transactionJSON.madeBy,
          'profilePicture',
        )
      }
      if (transactionJSON?.product?.courseThumbnail) {
        transactionJSON.product.courseThumbnail = await preSigner(
          transactionJSON.product,
          'courseThumbnail',
        )
      }
      transactionArray.push(transactionJSON)
    }
    response.transactions = transactionArray
    response.totalTransactions = totalTransactions
    response.totalPages = totalPages
    response.currentPage = page
    res.status(200).send(response)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getAllTransactions = getAllTransactions

const getOneTransaction = async (req, res) => {
  try {
    const transaction = await transactionModel
      .findOne({ _id: req.params.id })
      .populate('product', ['courseName', 'courseThumbnail'])
      .populate('madeBy', ['fullName', 'profilePicture'])
    if (!transaction) {
      res.status(404).send('Transaction not found')
    }
    if (transaction?.madeBy?.profilePicture) {
      transaction.madeBy.profilePicture = await preSigner(
        transaction.madeBy,
        'profilePicture',
      )
    }
    if (transaction?.product?.courseThumbnail) {
      transaction.product.courseThumbnail = await preSigner(
        transaction.product,
        'courseThumbnail',
      )
    }
    const fileFields = [
      'bankStatement',
      'payslips',
      'buisnessProof',
      'addressProof',
    ]
    for (let fileField of fileFields) {
      if (transaction[fileField]) {
        transaction[fileField] = await preSigner(transaction, fileField)
      }
    }
    if (transaction?.panCard?.front) {
      transaction.panCard.front = await preSigner(transaction.panCard, 'front')
    }
    if (transaction?.panCard?.back) {
      transaction.panCard.back = await preSigner(transaction.panCard, 'back')
    }
    if (transaction?.adhaarCard?.front) {
      transaction.adhaarCard.front = await preSigner(
        transaction.adhaarCard,
        'front',
      )
    }
    if (transaction?.adhaarCard?.back) {
      transaction.adhaarCard.back = await preSigner(
        transaction.adhaarCard,
        'back',
      )
    }
    res.status(200).send(transaction)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getOneTransaction = getOneTransaction
const razorPayWebhook = async (req, res) => {
  try {
    const {
      transactionId,
      locationId,
      batchId,
      courseId,
    } = req.body.payload.payment.entity.notes
    const { status, method, id } = req.body.payload.payment.entity
    const rpayPending = await transactionModel.findOne({
      _id: transactionId,
      status: 'rpending',
    })
    if (!rpayPending) {
      return res.status(200)
    }
    if (status == 'authorized') {
      rpayPending['razorpay_payment_id'] = id
      rpayPending['paymentMethod'] = method
      rpayPending['status'] = 'successful'
      await rpayPending.save()
      return res.status(200)
    } else if (status == 'failed') {
      rpayPending['razorpay_payment_id'] = id
      rpayPending['paymentMethod'] = method
      rpayPending['status'] = 'failed'
      await rpayPending.save()
      return res.status(200)
    } else {
      return res.status(200)
    }
  } catch (e) {
    console.log(e)
    return res.status(200)
  }
}
module.exports.razorPayWebhook = razorPayWebhook
const updateTransaction = async (req, res) => {
  try {
    const transaction = await transactionModel.findOne({ _id: req.params.id })
    if (!transaction) {
      res.status(404).send('Transaction not found')
    }
    const updates = Object.keys(req.body)
    updates.forEach((update) => (transaction[update] = req.body[update]))
    if (req.files.bankStatement) {
      transaction.bankStatement = req.files.bankStatement[0].key
    }
    if (req.files.payslips) {
      transaction.payslips = req.files.payslips[0].key
    }
    if (req.files.buisnessProof) {
      transaction.buisnessProof = req.files.buisnessProof[0].key
    }
    if (req.files.panCardFront) {
      transaction.panCard.front = req.files.panCardFront[0].key
    }
    if (req.files.panCardBack) {
      transaction.panCard.back = req.files.panCardBack[0].key
    }
    if (req.files.adhaarCardFront) {
      transaction.adhaarCard.front = req.files.adhaarCardFront[0].key
    }
    if (req.files.adhaarCardBack) {
      transaction.adhaarCard.back = req.files.adhaarCardBack[0].key
    }
    if (req.files.addressProof) {
      transaction.addressProof = req.files.addressProof[0].key
    }
    await transaction.save()
    res.status(200).send(transaction)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.updateTransaction = updateTransaction

const getFilteredTransactions = async (req, res) => {
  try {
    const filter = {}
    if (req.query.type) {
      filter.transactionType = req.query.type
    }
    if (req.query.productId) {
      filter.productId = req.query.productId
    }
    if (req.query.paymentMode) {
      filter.paymentMode = req.query.paymentMode
    }
    const response = {}
    const requiredFields = [
      'transactionType',
      'amount',
      'status',
      'productId',
      'paymentMode',
      'transactionId',
      'madeById',
      'createdAt',
    ]
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const totalTransactions = await transactionModel
      .find(filter)
      .countDocuments()
    const totalPages = Math.ceil(totalTransactions / limit)
    const transactions = await transactionModel
      .find(filter, requiredFields)
      .populate('product', 'courseName')
      .populate('madeBy', ['fullName', 'profilePicture'])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    for (let transaction of transactions) {
      if (transaction?.madeBy?.profilePicture) {
        transaction.madeBy.profilePicture = await preSigner(
          transaction.madeBy,
          'profilePicture',
        )
      }
    }
    response.transactions = transactions
    response.totalTransactions = totalTransactions
    response.totalPages = totalPages
    response.currentPage = page
    res.status(200).send(response)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getFilteredTransactions = getFilteredTransactions
