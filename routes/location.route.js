const router = require('express').Router()
const S3 = require('aws-sdk/clients/s3')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const CONFIG = require('../config/config')
const auth = require('../middlewares/auth.middleware')

const {
  getOneLocation,
  createLocation,
  getAllLocation,
  deleteLocations,
  updateLocation,
  filterLocation,
  createRoom,
  getAllRoom,
  getOneRoom,
  deleteRoom,
  updateRoom,
  updateMultipleRooms,
} = require('../controllers/location.controller')

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
        'locations/' +
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
  '/admin/locations',
  //  auth({ hasRole: ['admin'] }),
  getAllLocation,
)

router.get('/admin/locations/:id', auth({ hasRole: ['admin'] }), getOneLocation)

router.post('/admin/locations', auth({ hasRole: ['admin'] }), createLocation)

router.get(
  '/admin/location/filters',
  auth({ hasRole: ['admin'] }),
  filterLocation,
)

router.delete(
  '/admin/locations/:id',
  auth({ hasRole: ['admin'] }),
  deleteLocations,
)

router.patch(
  '/admin/locations/:id',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'outsideImg', maxCount: 1 },
    { name: 'commonAreaImg', maxCount: 1 },
    { name: 'activityImg', maxCount: 1 },
    { name: 'interviewImg', maxCount: 1 },
    { name: 'ongoingSessionImg', maxCount: 1 },
    { name: 'normanRoomImg', maxCount: 1 },
    { name: 'dieterRoom', maxCount: 1 },
    { name: 'pointersImage', maxCount: 1 },
    { name: 'pointerIcons', maxCount: 4 },
    { name: 'benifitsIcons', maxCount: 4 },
  ]),
  updateLocation,
)

router.get(
  '/admin/location/:locationId/room/:roomId',
  auth({ hasRole: ['admin'] }),
  getOneRoom,
)

router.get(
  '/admin/location/:locationId/room/',
  auth({ hasRole: ['admin'] }),
  getAllRoom,
)

router.post(
  '/admin/location/:locationId/room/',
  auth({ hasRole: ['admin'] }),
  createRoom,
)

router.patch(
  '/admin/location/:locationId/room/',
  auth({ hasRole: ['admin'] }),
  updateMultipleRooms,
)

router.delete(
  '/admin/location/:locationId/room/:roomId',
  auth({ hasRole: ['admin'] }),
  deleteRoom,
)

router.patch(
  '/admin/location/:locationId/room/:roomId',
  auth({ hasRole: ['admin'] }),
  updateRoom,
)
module.exports = router
