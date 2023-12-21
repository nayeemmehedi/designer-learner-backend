const router = require('express').Router()
const S3 = require('aws-sdk/clients/s3')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')

const CONFIG = require('../config/config')

const auth = require('../middlewares/auth.middleware')
const controller = require('../controllers/course.controller')

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

router.post(
  '/admin/courses',
  auth({ hasRole: ['admin'] }),
  controller.addCourse,
)

router.get(
  '/admin/courses',
  auth({ hasRole: ['admin'] }),
  controller.listAllCourses,
)

router.get(
  '/admin/courses/filter',
  auth({ hasRole: ['admin'] }),
  controller.filterCourses,
)

router.get(
  '/admin/courses/filter/sessiondurations',
  auth({ hasRole: ['admin'] }),
  controller.getFilterSessionDurations,
)

router.get(
  '/admin/courses/:id',
  auth({ hasRole: ['admin'] }),
  controller.getCourseDetails,
)

router.patch(
  '/admin/courses/:id',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'courseThumbnail', maxCount: 1 },
    { name: 'benefitsCardOneIcon', maxCount: 1 },
    { name: 'benefitsCardTwoIcon', maxCount: 1 },
    { name: 'benefitsCardThreeIcon', maxCount: 1 },
    { name: 'benefitsCardFourIcon', maxCount: 1 },
    { name: 'moduleIcon', maxCount: 10 },
    { name: 'eligibilityCardOneIcon', maxCount: 1 },
    { name: 'eligibilityCardTwoIcon', maxCount: 1 },
    { name: 'eligibilityCardThreeIcon', maxCount: 1 },
    { name: 'eligibilityCardFourIcon', maxCount: 1 },
    { name: 'careerProCardOneIcon', maxCount: 1 },
    { name: 'careerProCardTwoIcon', maxCount: 1 },
    { name: 'careerProCardThreeIcon', maxCount: 1 },
    { name: 'careerProCardFourIcon', maxCount: 1 },
    { name: 'testimonials', maxCount: 5 },
  ]),
  controller.updateCourse,
)

router.delete(
  '/admin/courses/:id',
  auth({ hasRole: ['admin'] }),
  controller.deleteCourse,
)

router.post(
  '/admin/courses/:id/active',
  auth({ hasRole: ['admin'] }),
  controller.activateCourse,
)

router.post(
  '/admin/courses/:id/inactive',
  auth({ hasRole: ['admin'] }),
  controller.deactivateCourse,
)

router.post(
  '/admin/courses/:id/curriculums',
  auth({ hasRole: ['admin'] }),
  controller.createCurriculum,
)

router.get(
  '/admin/courses/:id/curriculums',
  auth({ hasRole: ['admin'] }),
  controller.getCurriculums,
)

router.get(
  '/admin/courses/:id/curriculums/:curriculumId',
  auth({ hasRole: ['admin'] }),
  controller.getOneCurriculum,
)

router.patch(
  '/admin/courses/:id/curriculums/:curriculumId',
  auth({ hasRole: ['admin'] }),
  controller.updateCurriculum,
)

router.patch(
  '/admin/courses/:id/curriculums/:curriculumId',
  auth({ hasRole: ['admin'] }),
  controller.removeCurriculum,
)

router.post(
  '/admin/courses/:id/curriculums/:curriculumId/active',
  auth({ hasRole: ['admin'] }),
  controller.activateCurriculum,
)

router.post(
  '/admin/courses/:id/curriculums/:curriculumId/inactive',
  auth({ hasRole: ['admin'] }),
  controller.deactivateCurriculum,
)

router.post(
  '/admin/courses/:id/curriculums/:curriculumId/sessions',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'sessionIcon', maxCount: 1 },
    { name: 'figmaDocument', maxCount: 1 },
    { name: 'XDDocument', maxCount: 1 },
    { name: 'document', maxCount: 10 },
    { name: 'activityDocument', maxCount: 1 },
    { name: 'certificateTemplate', maxCount: 1 },
  ]),
  controller.createCurriculumSession,
)

router.get(
  '/admin/courses/:id/curriculums/:curriculumId/sessions',
  auth({ hasRole: ['admin'] }),
  controller.getCurriculumSessions,
)

router.get(
  '/admin/courses/:id/curriculums/:curriculumId/sessions/:sessionId',
  auth({ hasRole: ['admin'] }),
  controller.getOneCurriculumSession,
)

router.patch(
  '/admin/courses/:id/curriculums/:curriculumId/sessions/:sessionId',
  auth({ hasRole: ['admin'] }),
  upload.fields([
    { name: 'sessionIcon', maxCount: 1 },
    { name: 'figmaDocument', maxCount: 1 },
    { name: 'XDDocument', maxCount: 1 },
    { name: 'document', maxCount: 10 },
    { name: 'activityDocument', maxCount: 1 },
    { name: 'certificateTemplate', maxCount: 1 },
  ]),
  controller.updateCurriculumSession,
)

router.delete(
  '/admin/courses/:id/curriculums/:curriculumId/sessions/:sessionId',
  auth({ hasRole: ['admin'] }),
  controller.removeCurriculumSession,
)

router.get('/learner/courses', controller.getCourseCatalogue)

router.get(
  '/learner/courses/enrolled',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  controller.getEnrolledCourses,
)

router.get('/learner/courses/:id', controller.getCourseDetails)

router.get('/learner/courses/:courseId/batches', controller.getCourseBatches)

router.get(
  '/learner/courses/:id/onboarding',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  controller.getEnrolledCourseOnboarding,
)

router.post(
  '/learner/courses/:id/onboarding',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  controller.submitCourseOnboarding,
)

router.patch(
  '/learner/courses/:id/onboarding',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  controller.updateCourseOnboarding,
)

router.get(
  '/learner/courses/:id/sessions',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  controller.getAllEnrolledSessions,
)

router.get(
  '/learner/courses/:id/sessions/:sessionId',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  controller.getEnrolledSession,
)

module.exports = router
