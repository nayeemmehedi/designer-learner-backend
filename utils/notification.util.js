const admin = require('firebase-admin')

const sendNotification = (details) => {
  var db = admin.database()
  var notificationRef = db.ref(`/notifications/${details.receiverId}`)
  const notification = {
    type: `${details.type}`,
    timestamp: admin.database.ServerValue.TIMESTAMP,
    objectId: `${details.objectId}`,
    objectName: `${details.objectName}`,
    batchId: details.batchId || null,
    courseId: details.courseId || null,
    sessionId: details.sessionId || null,
    seen: false,
  }
  notificationRef.push().set(notification)
}

module.exports = sendNotification