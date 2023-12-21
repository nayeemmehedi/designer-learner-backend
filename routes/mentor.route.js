const router = require('express').Router()
const controller = require('../controllers/mentor.controller')
const auth = require('../middlewares/auth.middleware')
const Dcontroller = require('../controllers/mentorDashboard.controller')
router.get(
  '/mentor/courses',
  auth({ hasRole: ['mentor'] }),
  controller.getAllAssignedCourses,
)
router.get(
  '/mentor/dashboard',
  auth({ hasRole: ['mentor'] }),
  Dcontroller.GetCoursesDetials,
)
router.get(
  '/mentor/courses/:id',
  auth({ hasRole: ['mentor'] }),
  controller.getAllAssignedCourses,
)

router.get(
  '/mentor/courses/:id/onboarding',
  auth({ hasRole: ['mentor'] }),
  controller.getAssignedCourseOnboarding,
)

router.post(
  '/mentor/courses/:id/onboarding',
  auth({ hasRole: ['mentor'] }),
  controller.submitCourseOnboarding,
)

router.patch(
  '/mentor/courses/:id/onboarding',
  auth({ hasRole: ['mentor'] }),
  controller.updateCourseOnboarding,
)

router.get(
  '/mentor/courses/:id/sessions',
  auth({ hasRole: ['mentor'] }),
  controller.getAllAssignedBatchSessions,
)

router.get(
  '/mentor/courses/:id/sessions/:sessionId',
  auth({ hasRole: ['mentor'] }),
  controller.getSessionDetails,
)

module.exports = router
