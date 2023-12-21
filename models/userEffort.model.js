const mongoose = require('mongoose')

const schema = mongoose.Schema({
  uid: String,
  Date: Date,
  Time: {
    type: Number,
    default: 0,
  },
})

module.exports = mongoose.model('UserEffort', schema)
