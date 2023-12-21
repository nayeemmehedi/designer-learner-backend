const router = require('express').Router()

const auth = require('../middlewares/auth.middleware')

const {
  getAllRequestByStatus,
  getOneRequest,
  updateRequest,
} = require('../controllers/adminCalendarRequest.controller')

router.get(
  '/admin/mentorrequests/status/:status',
  auth({ hasRole: ['admin'] }),
  getAllRequestByStatus,
)
router.get(
  '/admin/mentorrequests/:id',
  auth({ hasRole: ['admin'] }),
  getOneRequest,
)
router.patch(
  '/admin/mentorrequests/:id/:action',
  auth({ hasRole: ['admin'] }),
  updateRequest,
)
module.exports = router
