const getDeadline = (givenDate, deadline) => {
  let deadDay
  if (deadline == 'sunday') {
    deadDay = 0
  } else if (deadline == 'monday') {
    deadDay = 1
  } else if (deadline == 'tuesday') {
    deadDay = 2
  } else if (deadline == 'wendesday') {
    deadDay = 3
  } else if (deadline == 'thursday') {
    deadDay = 4
  } else if (deadline == 'friday') {
    deadDay = 5
  } else if (deadline == 'saturday') {
    deadDay = 6
  }
  let diff = 0
  let d = new Date(givenDate)
  let loop = true
  while (loop) {
    d.setDate(d.getDate() + 1)
    diff += 1
    if (d.getDay() == deadDay) {
      if (diff >= 7) {
        loop = false
      }
    }
  }
  d.setDate(d.getDate() + 1)
  return d
}

const isOverDue = (givenDate, deadline) => {
  const todayDate = new Date() //Today Date
  const deadDate = getDeadline(givenDate, deadline)
  const dateOne = new Date(deadDate)
  return todayDate > dateOne
}

module.exports = { getDeadline, isOverDue }
