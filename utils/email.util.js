const sgMail = require('@sendgrid/mail')

const CONFIG = require('../config/config')

sgMail.setApiKey(CONFIG.SENDGRID_EMAIL_API_KEY)

const sendEmail = (details) => {
  const msg = {
    to: details.receiver,
    from: {
      name: 'Designerrs',
      email: 'skudagi@gmail.com',
    },
  }
  details.receiver
  if (details.type == 'reschedule') {
    msg.subject = `your session has been rescheduled for ${details.date}`
    msg.html = `<p>Hello ${details.name}</p>
<br>
<p>I am writing this email to inform you that your session on ${details.sessionName} has been rescheduled on ${details.date} at ${details.time}..</p>
<br>
<p>I wish your presence in the session!</p>
<br>
<p>Please contact me in case you have any issue in this regards.</p>
<br>
<p>Thank you,</p>`
  }
  if (details.type == 'new_mentor') {
    msg.subject = 'Know your mentor!'
    msg.html = `
<p>Hello ${details.uName}</p>
<br>
I am pleased to announce ${details.name}  as the mentor of your batch.
<br>
${details.about.heading || ''}
<br>
${details.about.body || ''}
<br>
I hope you have a productive learning session!

Thank you!`
  }
  if (details.type == 'OTP') {
    msg.subject = 'Deignerrs OTP'
    msg.text = `Your OTP for Designerrs is: ${details.otp}`
  }
  if (details.type == 'invite') {
    msg.subject = 'Deignerrs Invitation'
    msg.html = `You have been invited to Designerrs. Login using the following credentials: <br> Username: ${details.username} <br> Password: ${details.password}`
  }
  if (details.type == 'mentor_invite') {
    msg.subject = 'Designerrs mentor invitation'
    msg.html = `you have been invited to Designerrs mentor. Please login and accept the invitation`
  }
  sgMail
    .send(msg)
    .then((response) => {
      console.log(`Email delivered with status: ${response[0].statusCode}`)
    })
    .catch((error) => {
      console.log(error.response.body)
    })
}

module.exports = sendEmail
