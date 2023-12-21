const CONFIG = require("../config/config");

const userModel = require("../models/user.model");
const userPermissionModel = require("../models/userPermission.model");

const preSigner = require("../utils/urlGenerator.util");

const readAdmin = async (req, res) => {
  try {
    const admin = await userModel.findOne({ uid: req.params.id });
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }
    if (admin.profilePicture) {
      admin.profilePicture = await preSigner(admin, "profilePicture");
    }
    const allowedRoles = {
      learner: true,
      mentor: false,
      admin: false,
    }
    const userPermissions = await userPermissionModel.findOne({ userId: req.uid });
    if (userPermissions) {
      for (let adminPermission in userPermissions.admin) {
        if (userPermissions?.admin[adminPermission].view.length > 0 ||
          userPermissions?.admin[adminPermission].edit.length > 0 ||
          userPermissions?.admin[adminPermission].delete.length > 0) {
          allowedRoles.admin = true;
          break;
        }
      }
      for (let mentorPermission in userPermissions.mentor) {
        if (userPermissions?.mentor[mentorPermission].view.length > 0 ||
          userPermissions?.mentor[mentorPermission].interact.length > 0 ||
          userPermissions?.mentor[mentorPermission].delete.length > 0) {
          allowedRoles.mentor = true;
          break;
        }
      }
    }
    admin._doc.allowedRoles = allowedRoles;
    return res.status(200).send(admin);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
};

module.exports.readAdmin = readAdmin;

const updateAdmin = async (req, res) => {
  try {
    const admin = await userModel.findOne({ uid: req.params.id });
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }
    const excludedFields = ["uid", "_id", "username"];
    let updates = Object.keys(req.body);
    updates = updates.filter((value) => !excludedFields.includes(value));
    for (let update of updates) {
      admin[update] = req.body[update];
    }
    if (req.files?.profilePicture) {
      admin.profilePicture = req.files.profilePicture[0].key;
    }
    await admin.save();
    return res.status(200).send(admin);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
};

module.exports.updateAdmin = updateAdmin;

const deleteAdmin = async (req, res) => {
  try {
    const admin = await userModel.findOne({ uid: req.params.id });
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }
    await admin.remove();
    return res.status(200).send(admin);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
};

module.exports.deleteAdmin = deleteAdmin;
