const otpGenerator = require("otp-generator")
const validator = require("validator")
const axios = require("axios")

const CONFIG = require("../config/config")
const sendEmail = require("./email.util")

const otpModel = require("../models/otp.model")

const AddMinutesToDate = (date, minutes) => {
  return new Date(date.getTime() + minutes*60000);
}

const isPhone = (value) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
  return phoneRegex.test(value)
}

const sendOtp = async (username) => {
  try{
    const otp = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      lowerCaseAlphabets: false, 
      specialChars: false 
    })
    const now = new Date()
    const otpExpiry = AddMinutesToDate(now, 60)
    if(isPhone(username)){
      const message = `Your OTP for Designerrs is: ${otp}`
      const sendOtp = await axios.get(
        `${CONFIG.SMS_API_URL}?username=${CONFIG.SMS_API_USERNAME}&apikey=${CONFIG.SMS_API_KEY}&apirequest=Text&route=ServiceImplicit&sender=${CONFIG.SMS_API_SENDER}&mobile=${username}&message=${message}`
      )
      if(sendOtp.data.status == "error"){
        throw new Error("An error occured while sending OTP")
      }
    }
    if(validator.isEmail(username)){
      sendEmail({receiver: username, otp: otp, type: 'OTP'})
    }
    const otpInstance = new otpModel({
      otp: otp,
      otpExpiry: otpExpiry,
      sentTo: username
    })
    await otpInstance.save()
  } catch(e){
    console.log(e)
    return e.message
  }
}

const verifyOtp = async (otp) => {
  const now = new Date()
  const otpInstance = await otpModel.findOne({
    otp: otp,
    verified: false,
    otpExpiry: { $gt: now },
  })
  if(!otpInstance){
    return false
  }
  await otpInstance.remove()
  return true
}

module.exports = {sendOtp, verifyOtp}