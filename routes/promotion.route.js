const router = require('express').Router()
const auth = require('../middlewares/auth.middleware')
const controller = require('../controllers/promotion.controller')

router.post(
  '/admin/promotions',
  auth({ hasRole: ['admin'] }),
  controller.createPromotion,
)

router.get(
  '/admin/promotions',
  auth({ hasRole: ['admin'] }),
  controller.getAllPromotions,
)

router.get(
  '/admin/promotions/filter',
  auth({ hasRole: ['admin'] }),
  controller.filterPromotions,
)

router.get(
  '/admin/promotions/:id',
  auth({ hasRole: ['admin'] }),
  controller.getOnePromotion,
)

router.patch(
  '/admin/promotions/:id',
  auth({ hasRole: ['admin'] }),
  controller.updatePromotion,
)

router.delete(
  '/admin/promotions/:id',
  auth({ hasRole: ['admin'] }),
  controller.deletePromotion,
)

router.get('/learners/course/:id/promotions', controller.getPromotionBycourse)

module.exports = router
