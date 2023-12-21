const kycModel = require('../models/kyc.model')
const transactionModel = require('../models/transaction.model')
const preSigner = require('../utils/urlGenerator.util')

const updateKyc = async (req, res) => {
  try {
    const id = req.uid
    let kyc = await kycModel.findOne({ uid: id })
    if (!kyc) {
      kyc = await kycModel.create({ uid: id })
    }
    if (req.body.ref1_name) {
      kyc.refPerson1.name = req.body.ref1_name
    }
    if (req.body.ref1_number) {
      kyc.refPerson1.phoneNumber = req.body.ref1_number
    }
    if (req.body.ref2_name) {
      kyc.refPerson2.name = req.body.ref2_name
    }
    if (req.body.submitted && req.body.submitted == 'true') {
      kyc.status = 'submited'
      // transaction succesful
      let transactions = await transactionModel.findOne({
        madeById: id,
        paymentMode: 'neevFinance',
        status: 'pending',
      })
      if (transactions) transactions['status'] = 'successful'
      await transactions.save()
    }
    if (req.body.ref2_number) {
      kyc.refPerson2.phoneNumber = req.body.ref2_number
    }
    if (req.files.bankStatement) {
      kyc.bankStatement = req.files.bankStatement[0].key
    }
    if (req.files.payslips) {
      kyc.payslips = req.files.payslips[0].key
    }
    if (req.files.buisnessProof) {
      kyc.buisnessProof = req.files.buisnessProof[0].key
    }
    if (req.files.panCardFront) {
      kyc.panCard.front = req.files.panCardFront[0].key
    }
    if (req.files.panCardBack) {
      kyc.panCard.back = req.files.panCardBack[0].key
    }
    if (req.files.aadhaarCardFront) {
      kyc.aadharCard.front = req.files.aadhaarCardFront[0].key
    }
    if (req.files.aadhaarCardBack) {
      kyc.aadharCard.back = req.files.aadhaarCardBack[0].key
    }
    if (req.files.addressProof) {
      for (let i = 0; i < req.files.addressProof.length; i++) {
        kyc.addressProof[i] = req.files.addressProof[i].key
      }
    }
    await kyc.save()
    res.status(200).json(kyc)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const getKyc = async (req, res) => {
  try {
    const id = req.uid
    let kyc = await kycModel.findOne({ uid: id })
    if (!kyc) {
      kyc = await kycModel.create({ uid: id })
      return res.status(200).json(kyc)
    }
    const kycJSON = kyc.toJSON()
    const fileFields = ['bankStatement', 'payslips', 'buisnessProof']
    for (let fileField of fileFields) {
      if (kycJSON[fileField]) {
        kycJSON[fileField] = await preSigner(kycJSON, fileField)
      }
    }
    if (kycJSON?.panCard?.front) {
      kycJSON.panCard.front = await preSigner(kycJSON.panCard, 'front')
    }
    if (kycJSON?.panCard?.back) {
      kycJSON.panCard.back = await preSigner(kycJSON.panCard, 'back')
    }
    if (kycJSON?.aadharCard?.front) {
      kycJSON.aadharCard.front = await preSigner(kycJSON.aadharCard, 'front')
    }
    if (kycJSON?.aadharCard?.back) {
      kycJSON.aadharCard.back = await preSigner(kycJSON.aadharCard, 'back')
    }
    if (kycJSON?.addressProof && kycJSON?.addressProof?.length) {
      for (let i = 0; i < kycJSON.addressProof.length; i++) {
        kycJSON.addressProof[i] = await preSigner(kycJSON?.addressProof, i)
      }
    }
    res.status(200).json(kycJSON)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

const adminGetKyc = async () => {}
const adminGetAllKyc = async () => {}
const adminUpdateKyc = async () => {}
const isKycVerified = async () => {}

module.exports = {
  getKyc,
  updateKyc,
}
