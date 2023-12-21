const router = require('express').Router()
const auth = require('../middlewares/auth.middleware')
const {
  createBatch,
  deleteBatch,
  getAllBatch,
  getOneBatch,
  updateBatch,
  filterBatch,
} = require('../controllers/batch.controller')

router.get('/admin/batch', auth({ hasRole: ['admin'] }), getAllBatch)

router.get(
  '/admin/batch/filters',
   auth({ hasRole: ['admin'] }),
  filterBatch,
)

router.get('/admin/batch/:id', auth({ hasRole: ['admin'] }), getOneBatch)

router.post('/admin/batch', auth({ hasRole: ['admin'] }), createBatch)

router.delete('/admin/batch/:id', auth({ hasRole: ['admin'] }), deleteBatch)

router.patch('/admin/batch/:id', auth({ hasRole: ['admin'] }), updateBatch)

module.exports = router
