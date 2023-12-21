const mongoose = require('mongoose')

const calendarSchema = new mongoose.Schema({
  title: String,
  eventId: String,
  locationId: {
    type: String,
    ref: 'Location',
  },
  roomId: {
    type: String,
    ref: 'Room',
  },
  sessionId: {
    type: String,
    ref: 'Session',
  },
  start: Date,
  end: Date,
  startTime: Number,
  endTime: Number,
  type: {
    type: String,
    enum: ['batch', 'meetup'],
  },
  status: {
    type: String,
    enum: ['scheduling', 'scheduled', 'live', 'completed', 'incompleted'],
    default: 'scheduling',
  },
})

module.exports = mongoose.model('Calendar', calendarSchema)
