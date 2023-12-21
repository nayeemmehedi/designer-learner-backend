const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema(
  {
    roomName: String,
    capacity: Number,
    locationId: {
      type: String,
      ref: 'Location',
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Room', roomSchema)
