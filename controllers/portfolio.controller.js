const fs = require('fs')
const pdf = require('pdf-parse')
const S3 = require('aws-sdk/clients/s3')
const validator = require("validator")
const axios = require('axios')

const portfolioModel = require('../models/portfolio.model')
const CaseStudiesModel = require('../models/caseStudies.model')

const preSigner = require('../utils/urlGenerator.util')

const CONFIG = require("../config/config")

const s3 = new S3({
  accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  endpoint: CONFIG.AWS_S3_BUCKET_ENDPOINT,
  s3ForcePathStyle: true,
})

const createPortfolio = async (req, res) => {
  const uid = req.uid
  try {
    const body = { uid, ...req.body }
    const existingPortfolio = await portfolioModel.findOne({ uid: uid })
    if (existingPortfolio) {
      const updates = Object.keys(req.body)
      for (let update of updates) {
        existingPortfolio[update] = req.body[update]
      }
      await existingPortfolio.save()
      return res.status(200).send(existingPortfolio)
    }
    const Portfolio = await portfolioModel.create(body)
    return res.status(200).json({ Portfolio })
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.createPortfolio = createPortfolio

const deletePortfolio = async (req, res) => {
  const uid = req.uid
  try {
    const Portfolio = await portfolioModel.deleteOne({ uid: uid })
    res.status(200).json({ Portfolio })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.deletePortfolio = deletePortfolio

const getPortfolio = async (req, res) => {
  const uid = req.uid
  try {
    const Portfolio = await portfolioModel.findOne({ uid: uid }).populate('user', ['fullName', 'profilePicture'])
    if (!Portfolio) {
      return res.status(404).send('Portfolio not found.')
    }
    if(Portfolio?.user?.profilePicture){
      Portfolio.user.profilePicture = await preSigner(Portfolio.user, 'profilePicture')
    }
    const caseStudies = await CaseStudiesModel.find({ uid: uid })
    Portfolio._doc.caseStudies = caseStudies

    res.status(200).json({ Portfolio })
  } catch (e) {
    console.log(e)
    res.status(500).json(e.message)
  }
}

module.exports.getPortfolio = getPortfolio

const portfolioFromPDF = async (req, res) => {
  try{
    const allowedTypes = ['application/pdf']
    const portfolio = {
      uid: req.uid,
      socialMedia: {},
      about: {},
    }
    if(!req.files.linkedinPDF){
      return res.status(400).send('No file uploaded')
    }
    if(!allowedTypes.includes(req.files.linkedinPDF[0].mimetype)){
      return res.status(400).send('Invalid file type')
    }
    const dataBuffer = fs.readFileSync(`./temp/${req.uid}.pdf`)
    let parsedData = await pdf(dataBuffer)
    parsedData = parsedData.text.split('\n')
    for(let data of parsedData){
      if(validator.isEmail(data)){
        portfolio.email = data
      }else if(validator.isEmail(`${data}${parsedData[parsedData.indexOf(data)+1]}`)){
        portfolio.email = `${data}${parsedData[parsedData.indexOf(data)+1]}`
      }

      if(data.includes('(Mobile)')){
        let phone = data.replace('(Mobile)', '')
        phone  = phone.split(' ').join('')
        portfolio.phone = phone
      }
      if(data === 'Top Skills'){
        portfolio.skills = parsedData.splice(parsedData.indexOf(data) + 1, 3)
      }
      if(data.includes('(LinkedIn)')){
        portfolio.socialMedia.linkedIn = parsedData[parsedData.indexOf(data) - 1]
      }
      if(data === 'Summary'){
        portfolio.about.heading = parsedData[parsedData.indexOf(data) - 2]
        let aboutBody =  parsedData.splice(parsedData.indexOf(data) + 1, (parsedData.indexOf('Experience') - (parsedData.indexOf(data) + 1)))
        aboutBody = aboutBody.join(' ')
        portfolio.about.body = aboutBody
      }
      // if(data === 'Experience'){
      //   let count = parsedData.indexOf(data) + 1
      //   let workExperiences = []
      //   while(count < parsedData.length){
      //     let workExperience = {}
      //     if(parsedData[count] == 'Education' || parsedData[count] == 'Projects' || parsedData[count] == 'Awards'){
      //       break
      //     }
      //     if(parsedData[count] == ' ' || parsedData[count] == '\n' || parsedData[count].includes('Page ')){
      //       count++
      //       continue
      //     }
      //     console.log(parsedData[count])
      //     workExperience.designation = parsedData[count + 1]
      //     workExperience.companyName = parsedData[count]
      //     if(parsedData[count + 2].includes('Present')){
      //       workExperience.currentlyWorking = true
      //       workExperience.startDate = parsedData[count + 2].split('-')[0]
      //     }
      //     if(!workExperience.currentlyWorking){
      //       workExperience.startDate = parsedData[count + 2].split('-')[0]
      //       workExperience.endDate = parsedData[count + 2].split('-')[1]
      //     }
      //     workExperiences.push(workExperience)
      //     count ++          
      //   }
      //   portfolio.workExperience = workExperiences
      // }
      if(data === 'Education'){
        let count = parsedData.indexOf(data) + 1
        let educations = []
        while((parsedData[count] !== 'Projects' || parsedData[count] !== 'Awards') && count < parsedData.length){
          const education = {}
          if(parsedData[count] == ' ' || parsedData[count] == '\n' || parsedData[count].includes('Page ')){
            count++
            continue
          }
          education.institute = parsedData[count]
          education.course = parsedData[count + 1].split(',')[0]
          education.fieldOfStudy = parsedData[count + 1]?.split(',')[1]?.split('·')[0]
          let startDate = parsedData[count + 1]?.split('·')[1]?.split('-')[0]?.split('')?.splice(2, 4)?.join('')
          let endDate = parsedData[count + 1]?.split('·')[1]?.split('-')[1]?.split('')?.splice(1, 4)?.join('')
          education.startDate = startDate
          education.endDate = endDate
          educations.push(education)
          count += 2
        }
        portfolio.education = educations
      }
    }
    const existingPortfolio = await portfolioModel.findOne({ uid: req.uid })
    if (existingPortfolio) {
      existingPortfolio.skills = portfolio.skills
      existingPortfolio.socialMedia = portfolio.socialMedia
      existingPortfolio.about = portfolio.about
      await existingPortfolio.save()
      fs.unlinkSync(`./temp/${req.uid}.pdf`)
      return res.status(200).send(existingPortfolio)
    }
    const Portfolio = await portfolioModel.create(portfolio)
    fs.unlinkSync(`./temp/${req.uid}.pdf`)
    return res.status(200).send(Portfolio)
  }catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.portfolioFromPDF = portfolioFromPDF

const getIntegratedPortfolioData = async (req, res) => {
  try{
    if(req.query.type == 'medium'){
      const response = []
      var url = 'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/'
      const mediumProfile = await axios.get(`${url}@${req.query.username}`)
      const posts = mediumProfile?.data?.items
      for(let post of posts){
        const responsePost = {}
        responsePost.title = post.title
        responsePost.pubDate = post.pubDate
        responsePost.link = post.link
        responsePost.author = post.author
        responsePost.thumbnail = post.thumbnail
        response.push(responsePost)
      }
      return res.status(200).send(response)
    }
  }catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getIntegratedPortfolioData = getIntegratedPortfolioData