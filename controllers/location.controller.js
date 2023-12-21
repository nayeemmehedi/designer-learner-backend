const locationModel = require('../models/location.model')
const roomModel = require('../models/room.model')
const preSigner = require('../utils/urlGenerator.util')
const { dateToTime } = require('../utils/time.util')
const calendarModel = require('../models/calendar.model')
const batchModel = require('../models/batch.model')

const getAllLocation = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skipIndex = (page - 1) * limit
  try {
    let response = {}

    const requiredFields = [
      '_id',
      'locationCode',
      'locationName',
      'address.city',
      'status',
    ]
    const totalLocations = await locationModel.countDocuments()
    const totalPages = Math.ceil(totalLocations / limit)
    const locations = await locationModel
      .find({}, requiredFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)

    for (let location of locations) {
      const rooms = await roomModel.find({ locationId: location._id })
      location._doc.rooms = rooms
    }

    response.locations = locations
    response.totalPages = totalPages
    response.totalLocations = totalLocations
    response.currentPage = page

    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}
module.exports.getAllLocation = getAllLocation

const createLocation = async (req, res) => {
  try {
    const payload = req.body
    const location = await locationModel.create(payload)
    res.status(200).json({ location })
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.createLocation = createLocation

const deleteLocations = async (req, res) => {
  const id = req.params.id
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const location = await locationModel.deleteOne({ _id: id })
    if (!location) {
      return res.status(404).send('location not found.')
    }
    res.status(200).json({ location })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.deleteLocations = deleteLocations

const getOneLocation = async (req, res) => {
  const id = req.params.id
  const fileNamesArray = [
    'outsideImg',
    'commonAreaImg',
    'activityImg',
    'interviewImg',
    'ongoingSessionImg',
    'normanRoomImg',
    'dieterRoom',
    'pointerIcons',
    'benifitsIcons',
  ]
  const requiredFields = [
    '_id',
    'locationCode',
    'locationName',
    'address',
    'navigation',
    'images',
    'updatedAt',
    'status',
    'outsideImg',
    'commonAreaImg',
    'activityImg',
    'interviewImg',
    'ongoingSessionImg',
    'normanRoomImg',
    'dieterRoom',
    'pointers',
    'batchBenefits',
  ]
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const location = await locationModel.findOne({ _id: id }, requiredFields)

    if (!location) {
      return res.status(404).send('location not found.')
    }
    for (let fileName of fileNamesArray) {
      if (location[fileName]) {
        location[fileName] = await preSigner(location, fileName)
      }
    }
    if (location.pointers['pointersImage']) {
      location.pointers['pointersImage'] = await preSigner(
        location.pointers,
        'pointersImage',
      )
    }
    if (location?.pointers?.points?.length > 0) {
      for (let point of location.pointers.points) {
        if (point.icon) {
          point.icon = await preSigner(point, 'icon')
        }
      }
    }
    if (location?.batchBenefits?.points?.length > 0) {
      for (let point of location.batchBenefits.points) {
        if (point.icon) {
          point.icon = await preSigner(point, 'icon')
        }
      }
    }
    res.status(200).json({ location })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getOneLocation = getOneLocation

const updateLocation = async (req, res) => {
  const id = req.params.id
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  const fileNamesArray = [
    'outsideImg',
    'commonAreaImg',
    'activityImg',
    'interviewImg',
    'ongoingSessionImg',
    'normanRoomImg',
    'dieterRoom',
    'pointersImage',
    'pointerIconOne',
    'pointerIconTwo',
    'pointerIconThree',
    'pointerIconFour',
    'benifitsIconOne',
    'benifitsIconTwo',
    'benifitsIconThree',
    'benifitsIconFour',
  ]
  const requiredFields = [
    '_id',
    'locationCode',
    'locationName',
    'address',
    'navigation',
    'images',
    'updatedAt',
    'status',
  ]
  try {
    const location = await locationModel.findOne({ _id: req.params.id })
    if (!location) {
      return res.status(404).send('location not found.')
    }
    // for (let fileName of fileNamesArray) {
    //   if (req.files[fileName]) {
    //     location[fileName] = req.files[fileName][0].key
    //   }
    // }

    const updates = Object.keys(req.body)
    for (let update of updates) {
      location[update] = req.body[update]
    }

    await location.save()
    res.status(200).json({ location })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.updateLocation = updateLocation

const getAllRoom = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skipIndex = (page - 1) * limit

  try {
    let response = {}
    response.rooms = []

    const requiredFields = ['roomName', 'capacity']
    const calendarRequiredFields = [
      'start',
      'end',
      'repeatDays',
      'eventName',
      'type',
    ]
    const rooms = await roomModel
      .find({ locationId: req.params.locationId }, requiredFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
      .lean()

    for (let i = 0; i < rooms.length; i++) {
      const temp = rooms[i]
      const calendar = await calendarModel.find(
        { roomId: temp._id },
        calendarRequiredFields,
      )
      temp.calendar = calendar
      response['rooms'].push(temp)
    }
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}
module.exports.getAllRoom = getAllRoom

const createRoom = async (req, res) => {
  try {
    let response = []
    const rooms = req.body.rooms
    for (let room of rooms) {
      const newRoom = await roomModel.create({
        locationId: req.params.locationId,
        ...room,
      })
      response.push(newRoom)
    }
    res.status(200).send(response)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.createRoom = createRoom

const deleteRoom = async (req, res) => {
  const id = req.params.roomId
  if (!id) {
    return res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const room = await roomModel.deleteOne({ _id: id })
    if (!room) {
      return res.status(404).send('room not found.')
    }
    res.status(200).json({ room })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.deleteRoom = deleteRoom

const getOneRoom = async (req, res) => {
  const id = req.params.roomId
  const requiredFields = ['roomName', 'capacity']
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const room = await roomModel.findOne({ _id: id }, requiredFields)
    if (!room) {
      return res.status(404).send('room not found.')
    }
    res.status(200).send(room)
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message)
  }
}

module.exports.getOneRoom = getOneRoom

const updateRoom = async (req, res) => {
  const id = req.params.roomId
  if (!id) {
    res.status(403).json({ msg: `please provide a id` })
  }
  try {
    const room = await roomModel.findOne({ _id: id })
    if (!room) {
      return res.status(404).send('room not found.')
    }
    const updates = Object.keys(req.body)
    for (let update of updates) {
      room[update] = req.body[update]
    }
    await room.save()
    res.status(200).json({ room })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.updateRoom = updateRoom

const updateMultipleRooms = async (req, res) => {
  try{
    const rooms = req.body.rooms
    const response = []
    for(let room of rooms){
      const roomUpdate = await roomModel.findOne({_id: room._id})
      if(roomUpdate){
        roomUpdate.roomName = room.roomName
        roomUpdate.capacity = room.capacity
        await roomUpdate.save()
        response.push(roomUpdate)
      }
    }
    res.status(200).send(response)
  } catch(e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.updateMultipleRooms = updateMultipleRooms

const filterLocation = async (req, res) => {
  try {
    const response = {}
    response.locations = []
    const requiredFields = [
      '_id',
      'locationCode',
      'locationName',
      'address.city',
      'status',
    ]
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipIndex = (page - 1) * limit
    let findFilter = {}
    let calendarFilter = {}
    if (req.query.status) {
      findFilter.status = req.query.status
    }
    if (req.query.locationCode) {
      findFilter.locationCode = req.query.locationCode
    }
    if (req.query.status) {
      findFilter.status = req.query.status
    }
    if (req.query.startDate) {
      calendarFilter.start = { $gte: req.query.startDate }
    }
    if (req.query.endDate) {
      calendarFilter.endDate = { $lte: req.query.endDate }
    }
    if (req.query.startTime) {
      let sTime = dateToTime(parseInt(req.query.startTime))
      calendarFilter.startTime = { $gte: sTime }
    }
    if (req.query.endTime) {
      let eTime = dateToTime(parseInt(req.query.endTime))
      calendarFilter.endTime = { $lte: eTime }
    }

    if (req.query.duration) {
      const duration = parseInt(req.query.duration) * 100
      calendarFilter.$where = `this.endTime - this.startTime == ${duration}`
    }

    if (
      req.query.startDate ||
      req.query.endDate ||
      req.query.startTime ||
      req.query.endTime ||
      req.query.duration
    ) {
      const calendarEvents = await calendarModel.find(calendarFilter)
      let location_set = new Set()
      for (let calendarEvent of calendarEvents) {
        location_set.add(calendarEvent.locationId)
      }
      const locationsArray = Array.from(location_set)
      findFilter._id = { $in: locationsArray }
      const locations = await locationModel
        .find(findFilter, requiredFields)
        .sort({ createdAt: -1 })
        .skip(skipIndex)
        .limit(limit)
      const totalLocations = await locationModel
        .find(findFilter)
        .countDocuments()
      const totalPages = Math.ceil(totalLocations / limit)
      response.currentPage = page
      response.totalPages = totalPages
      response.totalLocation = totalLocations
      return res.status(200).json(response)
    } else {
      if (req.query.slots === 'allocated') {
        const rooms = await roomModel.find({})
        let rooms_set = new Set()
        for (let room of rooms) {
          rooms_set.add(room._id)
        }
        const calendarEvents = await calendarModel.find({
          roomId: { $in: Array.from(rooms_set) },
        })
        let location_set = new Set()
        for (let calendarEvent of calendarEvents) {
          location_set.add(calendarEvent.locationId)
        }
        const locationsArray = Array.from(location_set)
        findFilter._id = { $in: locationsArray }
        const locations = await locationModel
          .find(findFilter, requiredFields)
          .sort({ createdAt: -1 })
          .skip(skipIndex)
          .limit(limit)
        const totalLocations = await locationModel
          .find(findFilter)
          .countDocuments()
        const totalPages = Math.ceil(totalLocations / limit)
        response.currentPage = page
        response.totalPages = totalPages
        response.totalLocation = totalLocations
        return res.status(200).json(response)
      } else if (req.query.slots === 'empty') {
        const rooms = await roomModel.find({})
        let rooms_set = new Set()
        for (let room of rooms) {
          rooms_set.add(room._id)
        }
        const calendarEvents = await calendarModel.find({
          roomId: { $in: Array.from(rooms_set) },
        })
        let location_set = new Set()
        for (let calendarEvent of calendarEvents) {
          location_set.add(calendarEvent.locationId)
        }
        const locationsArray = Array.from(location_set)
        findFilter._id = { $nin: locationsArray }
        const locations = await locationModel
          .find(findFilter, requiredFields)
          .sort({ createdAt: -1 })
          .skip(skipIndex)
          .limit(limit)
        const totalLocations = await locationModel
          .find(findFilter)
          .countDocuments()
        const totalPages = Math.ceil(totalLocations / limit)
        response.locations = locations
        response.currentPage = page
        response.totalPages = totalPages
        response.totalLocation = totalLocations
        return res.status(200).json(response)
      } else {
        const locations = await locationModel
          .find(findFilter, requiredFields)
          .sort({ createdAt: -1 })
          .skip(skipIndex)
          .limit(limit)
        const totalLocations = await locationModel
          .find(findFilter)
          .countDocuments()
        const totalPages = Math.ceil(totalLocations / limit)
        response.locations = locations
        response.currentPage = page
        response.totalPages = totalPages
        response.totalLocation = totalLocations
        return res.status(200).json(response)
      }
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.filterLocation = filterLocation
