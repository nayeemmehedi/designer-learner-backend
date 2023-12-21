const router = require('express').Router()
const auth = require('../middlewares/auth.middleware')

const {
  createCaseStudies,
  deleteCaseStudies,
  getAllStudyCases,
  getOneCaseStudies,
  updateCaseStudies,
  getAllCaseStudiesForAdmin,
} = require('../controllers/caseStudies.controller')

router.get(
  '/learner/caseStudies',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  getAllStudyCases,
)

router.get(
  '/learner/caseStudies/:id',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  getOneCaseStudies,
)

router.post(
  '/learner/caseStudies',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  createCaseStudies,
)

router.patch(
  '/learner/caseStudies/:id',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  updateCaseStudies,
)

router.delete(
  '/learner/caseStudies/:id',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  deleteCaseStudies,
)

router.get(
  '/admin/caseStudies',
  auth({ hasRole: ['admin'] }),
  getAllCaseStudiesForAdmin,
)

module.exports = router
