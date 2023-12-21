const router = require('express').Router()
const S3 = require('aws-sdk/clients/s3')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const CONFIG = require('../config/config')
const auth = require('../middlewares/auth.middleware')

const {
  getAllMentors,
  getOneMentor,
  inviteMentor,
  updateMentorProfile,
  searchMentors,
  filterMentors,
} = require('../controllers/mentorManagement.contoller')

const s3 = new S3({
  signatureVersion: 'v4',
  accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  endpoint: CONFIG.AWS_S3_BUCKET_ENDPOINT,
  region: CONFIG.AWS_S3_BUCKET_REGION,
  s3ForcePathStyle: true,
})

const upload = multer({
  storage: multers3({
    s3: s3,
    acl: 'private',
    bucket: CONFIG.AWS_S3_BUCKET,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },

    key: (req, file, cb) => {
      const extension = path.extname(file.originalname)
      const fileName = file.originalname.replace(extension, '')
      cb(
        null,
        'courses/' +
          req.params.id +
          '/' +
          fileName +
          Date.now().toString() +
          extension,
      )
    },
  }),
})

router.get(
  '/admin/mentors/filters',
  auth({ hasRole: ['admin'] }),
  filterMentors,
)

router.get('/admin/mentors/', auth({ hasRole: ['admin'] }), getAllMentors)

router.get('/admin/mentors/search', auth({ hasRole: ['admin'] }), searchMentors)

router.get('/admin/mentors/:id', auth({ hasRole: ['admin'] }), getOneMentor)

router.post(
  '/admin/mentors/invite/:id',
  auth({ hasRole: ['admin'] }),
  inviteMentor,
)

router.patch(
  '/admin/mentors/:id',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'bankStatement', maxCount: 1 },
    { name: 'payslips', maxCount: 1 },
    { name: 'buisnessProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'panCardFront', maxCount: 1 },
    { name: 'panCardBack', maxCount: 1 },
    { name: 'aadhaarCardBack', maxCount: 1 },
    { name: 'aadhaarCardFront', maxCount: 1 },
    { name: 'mentorAgreement', maxCount: 10 },
  ]),
  updateMentorProfile,
)

module.exports = router
