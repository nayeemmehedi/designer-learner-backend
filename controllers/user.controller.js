const AWS = require('aws-sdk')
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const UserEffortModel = require('../models/userEffort.model')
const validator = require('validator')

const roleModel = require('../models/role.model')
const userModel = require('../models/user.model')
const userPermissionModel = require('../models/userPermission.model')
const globalSettingsModel = require('../models/globalsettings.model')

const preSigner = require('../utils/urlGenerator.util')
const sendEmail = require('../utils/email.util')

const CONFIG = require('../config/config')

const poolData = {
  UserPoolId: CONFIG.AWS_COGNITO_USER_POOL_ID,
  ClientId: CONFIG.AWS_COGNITO_CLIENT_ID,
}

AWS.config.region = CONFIG.AWS_COGNITO_REGION
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)
const CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider()

const addSelfSignupUser = async (req, res) => {
  try {
    const details = {}
    const username = req.body.username
    const globalsettings = await globalSettingsModel.findOne({}).populate('newUserRole')
    CognitoIdentityServiceProvider.adminAddUserToGroup(
      {
        GroupName: globalsettings?.newUserRole?.roleCategory || 'learner',
        Username: req.uid,
        UserPoolId: CONFIG.AWS_COGNITO_USER_POOL_ID,
      },
      async (err, data) => {
        if (err) {
          console.log(err)
          return res.send('User created succesfully but unable to add to group')
        }
        details.uid = req.uid
        if (validator.isEmail(username)) {
          details.email = username
        } else {
          details.phone = username
        }
        details.defaultRole = globalsettings?.newUserRole.roleCategory || 'learner'
        try {
          const existingUser = await userModel.findOne({ uid: req.uid })
          if (existingUser) {
            return res.status(400).send({ message: 'User already exists' })
          }
          const user = new userModel(details)
          const userPermissions = new userPermissionModel({
            userId: req.uid,
            admin: globalsettings?.newUserRole?.admin,
            admin: globalsettings?.newUserRole?.mentor,
          })
          await user.save()
          await userPermissions.save()
          return res
            .status(201)
            .send({ username: req.uid, confirmationStatus: true })
        } catch (e) {
          console.log(e)
          return res.status(500).send(e.message)
        }
      },
    )
  } catch (e) {
    console.log(e)
    return res.send(e.message)
  }
}

module.exports.addSelfSignupUser = addSelfSignupUser

const addUser = async (req, res) => {
  try {
    let userRole = 'learner'
    const roles = await roleModel.find({ _id: { $in: req.body.roles } })
    for (let role of roles) {
      if (role.roleCategory === 'admin') {
        userRole = 'admin'
        break
      }
      if (role.roleCategory === 'mentor' && userRole !== 'admin') {
        userRole = 'mentor'
      }
    }
    userPool.signUp(
      req.body.email,
      req.body.password,
      [],
      null,
      async (err, result) => {
        if (err) {
          return res.send(err)
        }
        CognitoIdentityServiceProvider.adminAddUserToGroup(
          {
            GroupName: userRole,
            Username: req.body.email,
            UserPoolId: CONFIG.AWS_COGNITO_USER_POOL_ID,
          },
          (err, data) => {
            if (err) {
              console.log(err)
              return res.send(
                'User created succesfully but unable to add to group',
              )
            }
          },
        )
        const user = new userModel({
          uid: result.userSub,
          defaultRole: userRole,
          status: 'active',
          creatorId: req.uid,
          ...req.body,
        })
        await user.save()
        sendEmail({
          receiver: req.body.email,
          type: 'invite',
          username: req.body.email,
          password: req.body.password,
        })
        return res.status(201).send(user)
      },
    )
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.addUser = addUser

const getAllUsers = async (req, res) => {
  try {
    const response = {}
    const requiredFields = [
      'uid',
      'fullName',
      'defaultRole',
      'roles',
      'profilePicture',
      'status',
      'phone',
      'email',
    ]
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    const totalUsers = await userModel.countDocuments()
    const totalPages = Math.ceil(totalUsers / limit)
    const users = await userModel
      .find({}, requiredFields)
      .populate('roles', ['roleTitle', 'roleCategory'])
      .populate('createdBy', ['fullName', 'profilePicture'])
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)

    for (let user of users) {
      if (user?.profilePicture) {
        user.profilePicture = await preSigner(user, 'profilePicture')
      }
    }
    response.users = users
    response.totalPages = totalPages
    response.totalUsers = totalUsers
    response.currentPage = page
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAllUsers = getAllUsers

const getOneUser = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ uid: req.params.id })
      .populate('createdBy', ['fullName', 'profilePicture'])
      .populate('roles')
      .populate('permissions')
    if (!user) {
      return res.status(404).send('User not found')
    }
    if (user?.createdBy?.profilePicture) {
      user.createdBy.profilePicture = await preSigner(
        user.createdBy,
        'profilePicture',
      )
    }
    return res.status(200).send(user)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOneUser = getOneUser

const updateUser = async (req, res) => {
  try {
    let userRole = 'learner'
    const user = await userModel.findOne({ uid: req.params.id })
    if (!user) {
      return res.status(404).send('User not found')
    }
    if (req.body.roles) {
      const roles = await roleModel.find({ _id: { $in: req.body.roles } })
      for (let role of roles) {
        if (role.roleCategory === 'admin') {
          userRole = 'admin'
          break
        }
        if (role.roleCategory === 'mentor' && userRole !== 'admin') {
          userRole = 'mentor'
        }
      }
    }
    if (user.defaultRole !== userRole) {
      CognitoIdentityServiceProvider.adminAddUserToGroup(
        {
          GroupName: userRole,
          Username: user.email,
          UserPoolId: CONFIG.AWS_COGNITO_USER_POOL_ID,
        },
        (err, data) => {
          if (err) {
            console.log(err)
          }
        },
      )
      CognitoIdentityServiceProvider.adminRemoveUserFromGroup(
        {
          GroupName: user.defaultRole,
          Username: user.email,
          UserPoolId: CONFIG.AWS_COGNITO_USER_POOL_ID,
        },
        (err, data) => {
          if (err) {
            console.log(err)
          }
        },
      )
    }
    if (req.body.email || req.body.phone) {
      const userData = {
        ClientMetadata: {},
        UserAttributes: [],
        Username: user.uid,
        UserPoolId: CONFIG.AWS_COGNITO_USER_POOL_ID,
      }
      if (req.body.email) {
        userData.UserAttributes.push({
          Name: 'email',
          Value: req.body.email,
        })
        userData.UserAttributes.push({
          Name: 'email_verified',
          Value: 'true',
        })
      }
      if (req.body.phone) {
        userData.UserAttributes.push({
          Name: 'phone_number',
          Value: req.body.phone,
        })
        userData.UserAttributes.push({
          Name: 'phone_number_verified',
          Value: 'true',
        })
      }
      CognitoIdentityServiceProvider.adminUpdateUserAttributes(
        userData,
        (err, data) => {
          if (err) {
            console.log(err)
          }
        },
      )
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      user[update] = req.body[update]
    }
    user.defaultRole = userRole
    await user.save()
    return res.status(200).send(user)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateUser = updateUser

const removeUser = async (req, res) => {
  try {
    const user = await userModel.findOne({ uid: req.params.id })
    if (!user) {
      return res.status(404).send('User not found')
    }
    CognitoIdentityServiceProvider.adminDeleteUser(
      {
        Username: user.uid,
        UserPoolId: CONFIG.AWS_COGNITO_USER_POOL_ID,
      },
      (err, data) => {
        if (err) {
          console.log(err)
        }
      },
    )
    await user.remove()
    return res.status(200).send(user)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.removeUser = removeUser

const createRole = async (req, res) => {
  try {
    let adminPriveleges
    let mentorPriveleges
    const role = new roleModel({
      createdById: req.uid,
      ...req.body,
    })
    if (req.body.admin) {
      adminPriveleges = Object.keys(req.body.admin)
    }
    if (req.body.mentor) {
      mentorPriveleges = Object.keys(req.body.mentor)
    }
    if (adminPriveleges) {
      for (let privilege of adminPriveleges) {
        if (
          req.body.admin[privilege]?.view?.length > 0 ||
          req.body.admin[privilege]?.edit?.length > 0 ||
          req.body.admin[privilege]?.delete?.length > 0
        ) {
          role.roleCategory = 'admin'
          break
        }
      }
    }
    if (role.roleCategory !== 'admin' && mentorPriveleges) {
      for (let privilege of mentorPriveleges) {
        if (
          req.body.mentor[privilege]?.view?.length > 0 ||
          req.body.mentor[privilege]?.interact?.length > 0 ||
          req.body.mentor[privilege]?.delete?.length > 0
        ) {
          role.roleCategory = 'mentor'
          break
        }
      }
    }
    await role.save()
    return res.status(200).send(role)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.createRole = createRole

const getAllRoles = async (req, res) => {
  try {
    const response = {}
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    const totalRoles = await roleModel.countDocuments()
    const totalPages = Math.ceil(totalRoles / limit)
    const roles = await roleModel
      .find({}, ['roleTitle', 'roleCategory', 'createdById'])
      .populate('createdBy', ['fullName', 'profilePicture'])
      .skip(skipIndex)
      .limit(limit)
    for (let role of roles) {
      if (role?.createdBy?.profilePicture) {
        role.createdBy.profilePicture = await preSigner(
          role.createdBy,
          'profilePicture',
        )
      }
      const usersCount = await userModel.countDocuments({ roles: role._id })
      role._doc.usersCount = usersCount
    }
    response.roles = roles
    response.totalPages = totalPages
    response.totalRoles = totalRoles
    response.currentPage = page
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAllRoles = getAllRoles

const getOneRole = async (req, res) => {
  try {
    const role = await roleModel
      .findOne({ _id: req.params.id })
      .populate('createdBy', ['fullName', 'profilePicture'])
    if (!role) {
      return res.status(404).send('Role not found')
    }
    if (role?.createdBy?.profilePicture) {
      role.createdBy.profilePicture = await preSigner(
        role.createdBy,
        'profilePicture',
      )
    }
    return res.status(200).send(role)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOneRole = getOneRole

const updateRole = async (req, res) => {
  try {
    let adminPriveleges
    let mentorPriveleges
    const role = await roleModel.findOne({ _id: req.params.id })
    if (!role) {
      return res.status(404).send('Role not found')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      role[update] = req.body[update]
    }
    if (req.body.admin) {
      adminPriveleges = Object.keys(req.body.admin)
    }
    if (req.body.mentor) {
      mentorPriveleges = Object.keys(req.body.mentor)
    }
    role.roleCategory = 'learner'
    if (adminPriveleges) {
      for (let privilege of adminPriveleges) {
        if (
          role.admin[privilege]?.view?.length > 0 ||
          role.admin[privilege]?.edit?.length > 0 ||
          role.admin[privilege]?.delete?.length > 0
        ) {
          role.roleCategory = 'admin'
          break
        }
      }
    }
    if (role.roleCategory !== 'admin' && mentorPriveleges) {
      for (let privilege of mentorPriveleges) {
        if (
          role.mentor[privilege]?.view?.length > 0 ||
          role.mentor[privilege]?.interact?.length > 0 ||
          role.mentor[privilege]?.delete?.length > 0
        ) {
          role.roleCategory = 'mentor'
          break
        }
      }
    }
    await role.save()
    return res.status(200).send(role)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateRole = updateRole

const deleteRole = async (req, res) => {
  try {
    const role = await roleModel.findOne({ _id: req.params.id })
    if (!role) {
      return res.status(404).send('Role not found')
    }
    await role.remove()
    return res.status(200).send(role)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.deleteRole = deleteRole

const assignUserPermissions = async (req, res) => {
  try {
    const user = await userModel.findOne({ uid: req.params.id })
    if (!user) {
      return res.status(404).send('User not found')
    }
    const userPermissions = new userPermissionModel({
      userId: req.params.id,
      ...req.body,
    })
    user.permissions = userPermissions._id.toString()
    await user.save()
    await userPermissions.save()
    return res.status(200).send(user)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.assignUserPermissions = assignUserPermissions

const updateUserPermissions = async (req, res) => {
  try {
    const user = await userModel.findOne({ uid: req.params.id })
    if (!user) {
      return res.status(404).send('User not found')
    }
    const userPermissions = await userPermissionModel.findOne({
      userId: user.uid,
    })
    if (!userPermissions) {
      return res.status(404).send('User permissions not found')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      userPermissions[update] = req.body[update]
    }
    await userPermissions.save()
    return res.status(200).send(userPermissions)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateUserPermissions = updateUserPermissions

const filterRoles = async (req, res) => {
  try {
    const filter = {}
    const response = {}
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    const roleCategories = req.query?.roleCategories?.split(',')
    if (roleCategories) {
      filter.roleCategory = { $in: roleCategories }
    }
    if (req.query.status) {
      filter.status = req.query.status
    }
    const totalRoles = await roleModel.countDocuments(filter)
    const totalPages = Math.ceil(totalRoles / limit)
    const roles = await roleModel.find(filter, [
      'roleTitle',
      'roleCategory',
      'status',
    ])
    for (let role of roles) {
      const usersCount = await userModel.countDocuments({ roles: role._id })
      role._doc.usersCount = usersCount
    }
    response.roles = roles
    response.totalPages = totalPages
    response.totalRoles = totalRoles
    response.currentPage = page
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.filterRoles = filterRoles

const filterUsers = async (req, res) => {
  try {
    const filter = {}
    const response = {}
    const requiredFields = [
      'uid',
      'fullName',
      'defaultRole',
      'roles',
      'profilePicture',
      'status',
      'phone',
      'email',
    ]
    if (req.query.role) {
      let roles_set = new Set()
      const queryRoles = req.query?.role?.split(',')
      const roles = await roleModel.find({ roleTitle: { $in: queryRoles } })
      for (let role of roles) {
        roles_set.add(role._id)
      }
      let rolesArray = Array.from(roles_set)
      filter.roles = { $in: rolesArray }
    }
    const status = req.query.status
    if (status) {
      filter.status = status
    }
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    const totalUsers = await userModel.countDocuments(filter)
    const totalPages = Math.ceil(totalUsers / limit)
    const users = await userModel
      .find(filter, requiredFields)
      .populate('roles', ['roleTitle', 'roleCategory'])
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
    response.users = users
    response.totalPages = totalPages
    response.totalUsers = totalUsers
    response.currentPage = page
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.filterUsers = filterUsers

const getUsersByRole = async (req, res) => {
  try {
    requiredFields = ['fullName', 'uid', 'profilePicture', 'status', 'roles']
    const role = await roleModel.findOne({
      roleTitle: { $regex: req.query.roleTitle, $options: 'i' },
    })
    if (!role) {
      return res.status(404).send({ message: 'Role not found' })
    }
    const users = await userModel
      .find({ roles: role._id, status: 'active' }, requiredFields)
      .populate('roles', ['roleTitle', 'roleCategory'])
    for (let user of users) {
      if (user?.profilePicture) {
        user.profilePicture = await preSigner(user, 'profilePicture')
      }
    }
    return res.status(200).send(users)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getUsersByRole = getUsersByRole

const getUserEffort = async (req, res) => {
  try {
    const response = {}
    const id = req.uid
    const startDate = new Date(req.query.startDate)
    const endDate = new Date(req.query.endDate)
    const UserEffort = await UserEffortModel.find({
      uid: id,
      Date: {
        $gte: startDate.setHours(00, 00),
        $lte: endDate.setHours(23, 59),
      },
    })
    if (!UserEffort) {
      return res.status(404).send('no data found')
    }
    const averageTime = await UserEffortModel.aggregate([
      {
        $match: {
          uid: id,
          Date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: id,
          avgTime: { $avg: '$Time' },
        },
      },
    ])
    response.days = UserEffort
    response.average = averageTime
    res.status(200).json(response)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}
module.exports.getUserEffort = getUserEffort

const updateUserEffort = async (req, res) => {
  try {
    const id = req.uid
    let date = new Date(req.body.date)
    date = new Date(date.setHours(0, 0, 0))
    const UserEffort = await UserEffortModel.findOne({
      uid: id,
      Date: date,
    })
    if (!UserEffort) {
      const newUserEffort = await UserEffortModel.create({
        uid: id,
        Date: date,
        Time: req.body.time,
      })
      return res.status(200).json(newUserEffort)
    }
    UserEffort['Time'] = req.body.time + UserEffort.Time
    await UserEffort.save()
    res.status(200).json(UserEffort)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}
module.exports.updateUserEffort = updateUserEffort
