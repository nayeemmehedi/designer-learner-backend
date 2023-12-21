const router = require("express").Router()
const S3 = require("aws-sdk/clients/s3")
const multer = require("multer")
const multers3 = require("multer-s3")
const path = require("path")

const CONFIG = require("../config/config")

const auth = require("../middlewares/auth.middleware")
const controller = require("../controllers/testimonial.controller")

const s3 = new S3({
  signatureVersion: "v4",
  accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  endpoint: CONFIG.AWS_S3_BUCKET_ENDPOINT,
  region: CONFIG.AWS_S3_BUCKET_REGION,
  s3ForcePathStyle: true,
})

const upload = multer({
  storage: multers3({
    s3: s3,
    acl: "private",
    bucket: CONFIG.AWS_S3_BUCKET,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },

    key: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      const fileName = file.originalname.replace(extension, "")
      cb(
        null,
        "testimonials/" +
        fileName +
        Date.now().toString() +
        extension
      )
    },
  }),
})

router.post(
  "/admin/testimonials",
  auth({ hasRole: ["admin"] }),
  upload.fields([{ name: "file", maxCount: 1 }]),
  controller.addTestimonial
)

router.get(
  "/admin/testimonials",
  auth({ hasRole: ["admin"] }),
  controller.getTestimonials
)

router.get(
  "/admin/testimonials/:id",
  auth({ hasRole: ["admin"] }),
  controller.getOneTestimonial
)

router.delete(
  "/admin/testimonials/:id",
  auth({ hasRole: ["admin"] }),
  controller.removeTestimonial
)

module.exports = router