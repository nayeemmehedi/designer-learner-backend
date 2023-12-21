const router = require('express').Router()

const auth = require('../middlewares/auth.middleware')

const {
  createProbBrief,
  deleteProbBrief,
  getProbBrief,
  updateProbBrief,
  getAllProbBrief,
} = require('../controllers/problembrief.controller')

router.get(
  '/admin/problemBriefs/:id',
  auth({ hasRole: ['admin', 'learner'] }),
  getProbBrief,
)

router.get(
  '/admin/problemBriefs',
  auth({ hasRole: ['admin', 'learner'] }),
  getAllProbBrief,
)

router.post(
  '/admin/problemBriefs',
  auth({ hasRole: ['admin'] }),
  createProbBrief,
)

router.delete(
  '/admin/problemBriefs/:id',
  auth({ hasRole: ['admin'] }),
  deleteProbBrief,
)

router.patch(
  '/admin/problemBriefs/:id',
  auth({ hasRole: ['admin'] }),
  updateProbBrief,
)

module.exports = router
