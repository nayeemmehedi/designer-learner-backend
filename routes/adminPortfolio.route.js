const router = require('express').Router()

const auth = require('../middlewares/auth.middleware')

const {
  addAdminPortfolio,
  deleteAdminPortfolio,
  getAdminPortfolio,
  getAllAdminPortfolio,
  updateAdminPortfolio,
  adminPortfolioWebPageSettings,
  adminPortfolioFilter,
} = require('../controllers/adminPortfolio.controller')

router.post('/admin/portfolio', auth({ hasRole: ['admin'] }), addAdminPortfolio)

router.get(
  '/admin/portfolio',
  auth({ hasRole: ['admin'] }),
  getAllAdminPortfolio,
)

router.get(
  '/admin/portfolio/filter',
  auth({ hasRole: ['admin'] }),
  adminPortfolioFilter,
)

router.post(
  '/admin/portfolio/websettings',
  auth({ hasRole: ['admin'] }),
  adminPortfolioWebPageSettings,
)

router.get(
  '/admin/portfolio/:id',
  auth({ hasRole: ['admin'] }),
  getAdminPortfolio,
)

router.delete(
  '/admin/portfolio/:id',
  auth({ hasRole: ['admin'] }),
  deleteAdminPortfolio,
)

router.patch(
  '/admin/portfolio/:id',
  auth({ hasRole: ['admin'] }),
  updateAdminPortfolio,
)

module.exports = router
