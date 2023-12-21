const userPermissionModel = require('../models/userPermission.model')

module.exports = (options) => {
  return async (req, res, next) => {
    try{
      const userPermissions = await userPermissionModel.findOne({userId: req.uid})
      if(!options){
        next()
      }
      const allowed = options.operations.every(operation => userPermissions[options.level][options.section][options.action].includes(operation))
      if(allowed){
        next()
      } else{
        return res.status(403).send({ error: 'Unauthorized' })
      }
    } catch(e){
      console.log(e)
      res.status(403).send({ error: "Unauthorized" })
    }
  }
}
