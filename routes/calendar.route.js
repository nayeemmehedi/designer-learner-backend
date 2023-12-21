const router = require('express').Router()
const S3 = require('aws-sdk/clients/s3')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const CONFIG = require('../config/config')
const auth = require('../middlewares/auth.middleware')
const {
  createCalendar,
  deleteCalendar,
  getCalendar,
  updateCalendar,
  getOneCalendar,
  getConflicts,
  saveCalendarEvents,
  mentorRescheduleRequest,
  getMentorCalendar,
} = require('../controllers/calendar.controller')

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
        'calendars/' +
          req.params.type +
          '/' +
          fileName +
          Date.now().toString() +
          extension,
      )
    },
  }),
})

router.post(
  '/admin/calendar/save',
  auth({hasRole: ['admin']}),
  saveCalendarEvents,
)

router.post(
  '/admin/calendar/:id/conflicts',
  auth({hasRole: ['admin']}),
  getConflicts,
)

router.get(
  '/admin/calendar/:type/:id',
  auth({ hasRole: ['admin'] }),
  getCalendar,
)

router.post(
  '/admin/calendar/:roomId/:type/:eventId',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'calendarThumbnail', maxCount: 0 },
  ]),
  createCalendar,
)

router.get(
  '/admin/calendar/:calendarId',
  auth({ hasRole: ['admin'] }),
  getOneCalendar,
)

router.delete(
  '/admin/calendar/:calendarId',
  auth({ hasRole: ['admin'] }),
  deleteCalendar,
)

router.patch(
  '/admin/calendar/:calendarId',
  auth({ hasRole: ['admin'] }),
  updateCalendar,
)

router.get(
  'mentor/calendar/:id/',
  auth({ hasRole: ['mentor'] }),
  getMentorCalendar,
)

router.post(
  '/mentor/calendar/:id/request',
  auth({ hasRole: ['mentor'] }),
  mentorRescheduleRequest,
)

module.exports = router
