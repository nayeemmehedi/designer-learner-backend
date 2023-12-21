const CONFIG = require("../config/config");

const userModel = require("../models/user.model");
const transactionModel = require("../models/transaction.model");
const userSessionMapModel = require("../models/userSessionmap.model");
const portfolioModel = require("../models/portfolio.model");
const userPermissionModel = require("../models/userPermission.model");
const roleModel = require("../models/role.model");

const preSigner = require("../utils/urlGenerator.util");

const readLearner = async (req, res) => {
  try {
    if (req.params.id !== req.uid) {
      return res
        .status(403)
        .send({ message: "You are not allowed to access this resource" });
    }
    const learner = await userModel.findOne({ uid: req.params.id });
    if (!learner) {
      return res.status(404).send({ message: "User not found" });
    }

    if (learner?.profilePicture) {
      learner.profilePicture = await preSigner(learner, "profilePicture");
    }
    const transactionResponses = []
    const courseTransactions = await transactionModel
      .find({ madeById: req.params.id, transactionType: "Course" })
      .populate("product", ["courseName", "courseCode", "courseThumbnail"])
      .populate({
        path: "batch",
        select: ["batchCode", "primaryMentorId"],
        populate: {
          path: "primaryMentor",
          select: ["fullName", "profilePicture"],
        },
      })
      .populate({
        path: "batch",
        select: ["batchCode", "primaryMentorId"],
        populate: { path: "curriculumId", select: ["sessionDuration"] },
      })
      .populate("location");
    for (let transaction of courseTransactions) {
      transaction = transaction.toJSON()
      if (transaction?.product?.courseThumbnail) {
        transaction.product.courseThumbnail = await preSigner(
          transaction.product,
          "courseThumbnail"
        );
      }
      if (transaction?.batch?.primaryMentor?.profilePicture) {
        transaction.batch.primaryMentor.profilePicture = await preSigner(
          transaction.batch.primaryMentor,
          "profilePicture"
        );
      }
      const onboardingSession = await userSessionMapModel
        .findOne({
          userId: req.params.id,
          batch: transaction.batch._id,
          sessionType: "Onboarding",
        })
        .populate("problemBriefs");

      transaction.problemBriefs = onboardingSession?.problemBriefs;
      transactionResponses.push(transaction);
    }
    const allowedRoles = {
      learner: true,
      mentor: false,
      admin: false,
    }
    const userPermissions = await userPermissionModel.findOne({ userId: req.uid });
    if (userPermissions) {
      for (let adminPermission in userPermissions.admin) {
        if (userPermissions?.admin[adminPermission]?.view?.length > 0 ||
          userPermissions?.admin[adminPermission]?.edit?.length > 0 ||
          userPermissions?.admin[adminPermission]?.delete?.length > 0) {
          allowedRoles.admin = true;
          break;
        }
      }
      for (let mentorPermission in userPermissions.mentor) {
        if (userPermissions?.mentor[mentorPermission]?.view?.length > 0 ||
          userPermissions?.mentor[mentorPermission]?.interact?.length > 0 ||
          userPermissions?.mentor[mentorPermission]?.delete?.length > 0) {
          allowedRoles.mentor = true;
          break;
        }
      }
    }
    learner._doc.courseTransactions = transactionResponses;
    learner._doc.allowedRoles = allowedRoles;
    return res.status(200).send(learner);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
};

module.exports.readLearner = readLearner;

const updateLearner = async (req, res) => {
  try {
    if (req.params.id !== req.uid) {
      return res
        .status(403)
        .send({ message: "You are not allowed to access this resource" });
    }
    const learner = await userModel.findOne({ uid: req.params.id });
    if (!learner) {
      return res.status(404).send({ message: "User not found" });
    }
    const excludedFields = ["uid", "_id"];
    let updates = Object.keys(req.body);
    updates = updates.filter((value) => !excludedFields.includes(value));
    for (let update of updates) {
      if (update == "gst") {
        if (req?.body?.gst?.gstNumber) {
          learner["gst"]["gstNumber"] = req.body["gst"]["gstNumber"];
        }
        if (req?.body?.gst?.companyName) {
          learner["gst"]["companyName"] = req.body["gst"]["companyName"];
        }
        continue;
      }
      learner[update] = req.body[update];
    }
    if (
      req.body.phoneOnPortfolio == true ||
      req.body.phoneOnPortfolio == "true"
    ) {
      const portfolio = await portfolioModel.findOne({ uid: req.params.id });
      if (!portfolio) {
        const newPortfolio = new portfolioModel({
          uid: req.params.id,
          phone: req.body.phone,
        });
        await newPortfolio.save();
      } else {
        portfolio.phone = req.body.phone;
        await portfolio.save();
      }
    }
    if (req.files?.profilePicture) {
      learner.profilePicture = req.files.profilePicture[0].key;
    }
    await learner.save();
    return res.status(200).send(learner);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
};

module.exports.updateLearner = updateLearner;

const deleteLearner = async (req, res) => {
  try {
    if (req.params.id !== req.uid) {
      return res
        .status(403)
        .send({ message: "You are not allowed to access this resource" });
    }
    const learner = await userModel.findOne({ uid: req.params.id });
    if (!learner) {
      return res.status(404).send({ message: "User not found" });
    }
    await learner.remove();
    return res.status(200).send(learner);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
};

module.exports.deleteLearner = deleteLearner;
