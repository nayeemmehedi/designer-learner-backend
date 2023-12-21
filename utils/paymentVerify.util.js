const crypto = require('crypto')

const verifyPayment = (secret, order_id, rp_id, rp_sign) => {
  let content = order_id + '|' + rp_id
  const hasher = crypto.createHmac('sha256', secret)
  const hash = hasher.update(content).digest('hex')
  if (hash == rp_sign) {
    return true
  }
  return false
}

module.exports = verifyPayment
