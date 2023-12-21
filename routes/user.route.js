const router = require('express').Router()
const auth = require('../middlewares/auth.middleware')
const controller = require('../controllers/user.controller')
const {
  getUserEffort,
  updateUserEffort,
} = require('../controllers/user.controller')

router.post('/newuser', auth(), controller.addSelfSignupUser)

router.post('/admin/users', auth({ hasRole: ['admin'] }), controller.addUser)

router.get('/admin/users', auth({ hasRole: ['admin'] }), controller.getAllUsers)

router.get(
  '/admin/users/role',
  auth({ hasRole: ['admin'] }),
  controller.getUsersByRole,
)

router.get(
  '/admin/users/filter',
  auth({ hasRole: ['admin'] }),
  controller.filterUsers,
)

router.get(
  '/admin/users/:id',
  auth({ hasRole: ['admin'] }),
  controller.getOneUser,
)

router.patch(
  '/admin/users/:id',
  auth({ hasRole: ['admin'] }),
  controller.updateUser,
)

router.delete(
  '/admin/users/:id',
  auth({ hasRole: ['admin'] }),
  controller.removeUser,
)

router.post(
  '/admin/users/:id/permissions',
  auth({ hasRole: ['admin'] }),
  controller.assignUserPermissions,
)

router.patch(
  '/admin/users/:id/permissions',
  auth({ hasRole: ['admin'] }),
  controller.updateUserPermissions,
)

router.post('/admin/roles', auth({ hasRole: ['admin'] }), controller.createRole)

router.get('/admin/roles', auth({ hasRole: ['admin'] }), controller.getAllRoles)

router.get(
  '/admin/roles/filter',
  auth({ hasRole: ['admin'] }),
  controller.filterRoles,
)

router.get(
  '/admin/roles/:id',
  auth({ hasRole: ['admin'] }),
  controller.getOneRole,
)

router.patch(
  '/admin/roles/:id',
  auth({ hasRole: ['admin'] }),
  controller.updateRole,
)

router.delete(
  '/admin/roles/:id',
  auth({ hasRole: ['admin'] }),
  controller.deleteRole,
)

router.get('/learner/effort', auth({ hasRole: ['learner', 'mentor', 'admin'] }), getUserEffort)

router.patch(
  '/learner/effort',
  auth({ hasRole: ['learner', 'mentor', 'admin'] }),
  updateUserEffort,
)

module.exports = router
