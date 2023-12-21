const calendarModel = require('../models/calendar.model')
const calendarRequestModel = require('../models/calendarRequest.model')
const roomModel = require('../models/room.model')
const batchModel = require('../models/batch.model')
const { dateToTime } = require('../utils/time.util')

const getOneCalendar = async (req, res) => {
  const id = req.params.calendarId
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }

  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const calendar = await calendarModel.findOne({ _id: id })
    if (!calendar) {
      return res.status(404).send('calendar not found.')
    }
    res.status(200).json({ calendar })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}
module.exports.getOneCalendar = getOneCalendar

const createCalendar = async (req, res) => {
  const roomId = req.params.roomId
  if (!roomId) {
    res.status(403).json({ message: `please provide a room id` })
  }
  const events = []
  try {
    const room = await roomModel.findOne({ _id: roomId })
    if (!room) {
      return res.status(404).send({ message: 'room not found.' })
    }
    if (req.params.type == 'batch') {
      const batch = await batchModel.findOne({ _id: req.params.eventId })
      if (!batch) {
        return res.status(404).send({ message: 'batch not found.' })
      }
      if (req.query.interval === 'week') {
        let {
          startDate,
          endDate,
          startTime,
          endTime,
          repeat,
          sessions,
        } = req.body

        startDate = new Date(startDate)
        endDate = new Date(endDate)
        startTime = new Date(startTime)
        endTime = new Date(endTime)

        const sTime = dateToTime(startTime)
        const eTime = dateToTime(endTime)

        let count = 0

        for (let i = startDate; i <= endDate; i.setDate(i.getDate() + 1)) {
          const event = {}
          if (repeat.includes(`${i.getDay()}`) && count < sessions.length) {
            const start = i.setHours(
              startTime.getHours(),
              startTime.getMinutes(),
            )
            const end = i.setHours(endTime.getHours(), endTime.getMinutes())

            event.eventId = req.params.eventId
            event.locationId = room.locationId
            event.roomId = roomId
            event.start = new Date(start)
            event.end = new Date(end)
            event.startTime = sTime
            event.endTime = eTime
            event.type = req.params.type
            event.sessionId = sessions[count]
            event.status = 'scheduling'
            event.title =
              req.params.type == 'batch'
                ? `${batch.batchCode}-${count + 1}/${sessions.length}`
                : 'meetup'

            count++
            events.push(event)
          }
        }
      }
      if (req.query.interval === 'month') {
        let { dates, startTime, endTime, sessions } = req.body

        startTime = new Date(startTime)
        endTime = new Date(endTime)

        const sTime = dateToTime(startTime)
        const eTime = dateToTime(endTime)

        let count = 0

        for (let date of dates) {
          const event = {}
          if (count < sessions.length) {
            date = new Date(date)
            const start = date.setHours(
              startTime.getHours(),
              startTime.getMinutes(),
            )
            const end = date.setHours(endTime.getHours(), endTime.getMinutes())

            event.eventId = req.params.eventId
            event.locationId = room.locationId
            event.roomId = roomId
            event.start = new Date(start)
            event.end = new Date(end)
            event.startTime = sTime
            event.endTime = eTime
            event.type = req.params.type
            event.sessionId = sessions[count]
            event.status = 'scheduling'
            event.title =
              req.params.type == 'batch'
                ? `${batch.batchCode}-${count + 1}/${sessions.length}`
                : 'meetup'

            count++
            events.push(event)
          }
        }
      }
      if (events.length > 0) {
        const calendars = await calendarModel.insertMany(events)
      }
      return res.status(200).send(events)
    }
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.createCalendar = createCalendar

const deleteCalendar = async (req, res) => {
  const id = req.params.calendarId
  if (!id) {
    return res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const calendar = await calendarModel.deleteOne({ _id: id })
    if (!calendar) {
      return res.status(404).send('calendar not found.')
    }
    res.status(200).json({ calendar })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.deleteCalendar = deleteCalendar

const getCalendar = async (req, res) => {
  const type = req.params.type
  const id = req.params.id
  const filter = {}
  if (type === 'location') {
    filter.locationId = id
  }
  if (type === 'room') {
    filter.roomId = id
  }
  const requiredFields = [
    'title',
    'eventId',
    'locationId',
    'roomId',
    'sessionId',
    'start',
    'end',
    'type',
    'status',
  ]
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const calendar = await calendarModel.find(filter, requiredFields)
    if (!calendar) {
      return res.status(404).send('calendar not found.')
    }
    res.status(200).json({ calendar })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getCalendar = getCalendar

const updateCalendar = async (req, res) => {
  const id = req.params.calendarId
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    if (req.query.modify == 'one') {
      const calendar = await calendarModel.findOne({ _id: id })
      if (!calendar) {
        return res.status(404).send('calendar not found.')
      }
      let { startTime, endTime, startDate, endDate } = req.body
      startTime = new Date(startTime)
      endTime = new Date(endTime)
      startDate = new Date(startDate)
      endDate = new Date(endDate)
      calendar.start = new Date(
        startDate.setHours(startTime.getHours(), startTime.getMinutes()),
      )
      calendar.end = new Date(
        endDate.setHours(endTime.getHours(), endTime.getMinutes()),
      )
      calendar.startTime = dateToTime(startTime)
      calendar.endTime = dateToTime(endTime)
      await calendar.save()
      return res.status(200).send(calendar)
    }
    if (req.query.modify == 'all') {
      let { startTime, endTime, roomId } = req.body
      startTime = new Date(startTime)
      endTime = new Date(endTime)

      const calendars = await calendarModel.find({
        eventId: id,
        roomId: roomId,
      })
      for (let calendar of calendars) {
        let start = new Date(calendar.start)
        let end = new Date(calendar.end)
        calendar.start = new Date(
          start.setHours(startTime.getHours(), startTime.getMinutes()),
        )
        calendar.end = new Date(
          end.setHours(endTime.getHours(), endTime.getMinutes()),
        )
        calendar.startTime = dateToTime(startTime)
        calendar.endTime = dateToTime(endTime)
        calendar.status = 'scheduling'
        await calendar.save()
      }
      const batch = await batchModel.findOne({ _id: id })
      batch.startTime = startTime
      batch.endTime = endTime
      await batch.save()
      return res.status(200).send(calendars)
    }
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.updateCalendar = updateCalendar

const getConflicts = async (req, res) => {
  try {
    let { startDate, endDate, startTime, endTime } = req.body
    startDate = new Date(startDate)
    endDate = new Date(endDate)
    startTime = new Date(startTime)
    endTime = new Date(endTime)
    const sTime = dateToTime(startTime)
    const eTime = dateToTime(endTime)
    const calendar = await calendarModel.find({
      roomId: req.params.id,
      eventId: { $ne: req.query.batch },
      start: { $gte: new Date(startDate.setHours(0, 0)) },
      end: { $lte: new Date(endDate.setHours(23, 59)) },
      $or: [
        { endTime: { $gte: sTime, $lte: eTime } },
        { startTime: { $gte: sTime, $lte: eTime } },
      ],
    })
    return res.send(calendar)
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getConflicts = getConflicts

const saveCalendarEvents = async (req, res) => {
  const { eventIds } = req.body
  try {
    for (let eventId in eventIds) {
      const calendar = await calendarModel.findOne({ eventId: eventId })
      if (calendar) {
        calendar.status = 'scheduled'
        await calendar.save()
      }
    }
    const batch = await batchModel.findOne({ _id: req.query.batch })
    batch.status = 'scheduled'
    await batch.save()
    res.status(200).send('Events Scheduled')
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.saveCalendarEvents = saveCalendarEvents

const getMentorCalendar = async (req, res) => {
  try {
    const batches = await batchModel
      .find({ mentorId: req.params.id, status: 'scheduled' })
      .distinct('_id')
    const calendars = await calendarModel.find({
      eventId: { $in: batches },
      status: { $in: ['scheduled', 'live'] },
    })
    return res.send(calendars)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getMentorCalendar = getMentorCalendar

const mentorRescheduleRequest = async (req, res) => {
  try {
    let { start, end, startTime, endTime } = req.body
    start = new Date(start)
    end = new Date(end)
    startTime = new Date(startTime)
    endTime = new Date(endTime)
    console.log(endTime)
    const calendarRequest = new calendarRequestModel({
      mentorId: req.uid,
      start: start,
      end: end,
      startTime: dateToTime(startTime),
      endTime: dateToTime(endTime),
      calendar: req.params.id,
    })
    await calendarRequest.save()
    return res.status(200).send(calendarRequest)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.mentorRescheduleRequest = mentorRescheduleRequest
