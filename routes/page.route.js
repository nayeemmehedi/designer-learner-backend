const router = require('express').Router()
const S3 = require('aws-sdk/clients/s3')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const CONFIG = require('../config/config')
const auth = require('../middlewares/auth.middleware')

const {
  createPage,
  listPages,
  filterPages,
  getOnePage,
  updatePage,
  removePage,
  createSection,
  updateSection,
  removeSection,
  getPageFromUrl,
  getItemFromUrl,
} = require('../controllers/page.controller')

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
        'pages/' +
          req.params.id +
          '/' +
          fileName +
          Date.now().toString() +
          extension,
      )
    },
  }),
})

router.post(
  '/admin/pages',
  upload.fields([{ name: 'image', maxCount: 1 }]),
  auth({ hasRole: ['admin'] }),
  createPage,
)

router.get('/admin/pages', auth({ hasRole: ['admin'] }), listPages)

router.get('/admin/pages/filter', auth({ hasRole: ['admin'] }), filterPages)

router.get('/admin/pages/:id', auth({ hasRole: ['admin'] }), getOnePage)

router.patch('/admin/pages/:id', auth({ hasRole: ['admin'] }), updatePage)

router.delete('/admin/pages/:id', auth({ hasRole: ['admin'] }), removePage)

router.post(
  '/admin/pages/:id/sections',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'image', maxCount: 10 },
    { name: 'personPhoto', maxCount: 10 },
    { name: 'icon', maxCount: 10 },
  ]),
  createSection,
)

router.patch(
  '/admin/pages/:id/sections/:sectionId',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'image', maxCount: 10 },
    { name: 'personPhoto', maxCount: 10 },
    { name: 'icon', maxCount: 10 },
  ]),
  updateSection,
)

router.delete(
  '/admin/pages/:id/sections/:sectionId',
  auth({ hasRole: ['admin'] }),
  removeSection,
)

router.get('/learner/pages/:page', getPageFromUrl)

router.get('/learner/pages/:pageType/:url', getItemFromUrl)

module.exports = router
