const router = require('express').Router()
const S3 = require('aws-sdk/clients/s3')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const CONFIG = require('../config/config')

const auth = require('../middlewares/auth.middleware')

const {
  createPortfolio,
  deletePortfolio,
  getPortfolio,
  portfolioFromPDF,
  getIntegratedPortfolioData
} = require('../controllers/portfolio.controller')

const s3 = new S3({
  signatureVersion: 'v4',
  accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  endpoint: CONFIG.AWS_S3_BUCKET_ENDPOINT,
  region: CONFIG.AWS_S3_BUCKET_REGION,
  s3ForcePathStyle: true,
})

// const upload = multer({
//   storage: multers3({
//     s3: s3,
//     acl: 'private',
//     bucket: CONFIG.AWS_S3_BUCKET,
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname })
//     },

//     key: (req, file, cb) => {
//       const extension = path.extname(file.originalname)
//       const fileName = file.originalname.replace(extension, '')
//       cb(
//         null,
//         'linkedin-profiles/' +
//           req.uid +
//           '/' +
//           fileName +
//           Date.now().toString() +
//           extension,
//       )
//     },
//   }),
// })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './temp')
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname)
    const fileName = file.originalname.replace(extension, '')
    cb(null, `${req.uid}${extension}`)
  }
})

const upload = multer({ storage: storage })

router.post(
  '/learner/portfolio',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  createPortfolio,
)

router.delete(
  '/learner/portfolio',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  deletePortfolio,
)

router.get(
  '/learner/portfolio',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  getPortfolio
)

router.get(
  '/learner/portfolio/integration',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  getIntegratedPortfolioData,
)

router.post(
  '/learner/portfolio/linkedin',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  upload.fields([{ name: 'linkedinPDF', maxCount: 1 }]),
  portfolioFromPDF,
)

module.exports = router
