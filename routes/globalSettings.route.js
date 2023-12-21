const router = require('express').Router()
const S3 = require('aws-sdk/clients/s3')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const CONFIG = require('../config/config')

const auth = require('../middlewares/auth.middleware')
const controller = require('../controllers/globalSettings.controller')

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
    acl: "private",
    bucket: CONFIG.AWS_S3_BUCKET,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },

    key: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      const fileName = file.originalname.replace(extension, "")
      cb(
        null,
        "globalsettings/" +
        fileName +
        Date.now().toString() +
        extension,
      )
    }
  })
})

router.get(
  "/admin/globalsettings",
  auth({ hasRole: ['admin'] }),
  controller.getGlobalSettings
)

router.post(
  "/admin/globalsettings",
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'websiteLogo', maxCount: 1 },
    { name: 'retinaLogo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
    { name: 'bangaloreImage', maxCount: 1 },
    { name: 'puneImage', maxCount: 1 },
    { name: 'delhiImage', maxCount: 1 },
    { name: 'mumbaiImage', maxCount: 1 },
    { name: 'onlineImage', maxCount: 1 },
    { name: 'benefitsOfSignupIcon', maxCount: 10 },
  ]),
  controller.updateGlobalSettings
)

router.post(
  "/admin/globalsettings/navigation",
  auth({ hasRole: ['admin'] }),
  controller.setNavigationPositions
)

router.get(
  "/admin/globalsettings/navigation",
  controller.getNavigationPages
)

router.get(
  "/admin/globalsettings/fields",
  controller.getGlobalSettingsFields
)

module.exports = router