const dateToTime = (date) => {
  const tempDate = new Date(date)
  let hours = tempDate.getHours().toString()
  let minutes = tempDate.getMinutes().toString()
  if (hours.length <= 1) {
    hours = '0' + hours
  }
  if (minutes.length <= 1) {
    minutes = '0' + minutes
  }

  let time = parseInt(`${hours}${minutes}`)
  return time
}

module.exports = {
  dateToTime,
}
