const router = require('express').Router()
const auth = require('../middlewares/auth.middleware')

const {
  getAssignmentsByBatch,
  getAssignment,
  updateAssignment,
} = require('../controllers/mentorAssignment.controller')

router.get(
  '/mentor/course/:id/batch/:batchId/assignments',
  auth({ hasRole: ['mentor'] }),
  getAssignmentsByBatch,
)

router.get(
  '/mentor/courses/:id/sessions/:sessionId/assignments/:assignmentId',
  auth({ hasRole: ['mentor'] }),
  getAssignment,
)

router.patch(
  '/mentor/courses/:id/sessions/:sessionId/assignments/:assignmentId',
  auth({ hasRole: ['mentor'] }),
  updateAssignment,
)
module.exports = router
