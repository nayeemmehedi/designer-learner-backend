const S3 = require('aws-sdk/clients/s3')

const CONFIG = require('../config/config')

const s3 = new S3({
  signatureVersion: 'v4',
  accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  endpoint: CONFIG.AWS_S3_BUCKET_ENDPOINT,
  region: CONFIG.AWS_S3_BUCKET_REGION,
  s3ForcePathStyle: true,
})

const generator = async (object, subObject) => {
  let values = object[subObject] || {}
  const objectUrls = {}
  // if (typeof values === 'string') values = { values }
  const params = {
    Bucket: CONFIG.AWS_S3_BUCKET,
    Key: values,
    Expires: 60 * 60 * 24 * 7,
  }
  objectUrls.name = values
  objectUrls.link = s3.getSignedUrl('getObject', params)
  // return { name: values, link: s3.getSignedUrl("getObject", params) }
  return objectUrls
}

module.exports = generator
