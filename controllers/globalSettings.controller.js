const globalSettingsModel = require('../models/globalsettings.model')
const pageModel = require('../models/page.model')

const preSigner = require('../utils/urlGenerator.util')

const getGlobalSettings = async (req, res) => {
  try {
    const fileNamesArray = [
      'websiteLogo',
      'retinaLogo',
      'favicon',
      'bangaloreImage',
      'puneImage',
      'delhiImage',
      'mumbaiImage',
      'onlineImage',
    ]
    const globalSettings = await globalSettingsModel.findOne({})
    if (!globalSettings) {
      return res.status(404).send({ message: 'Global settings not found.' })
    }
    for (let fileName of fileNamesArray) {
      if (globalSettings[fileName]) {
        globalSettings[fileName] = await preSigner(globalSettings, fileName)
      }
    }
    if (globalSettings.benefitsOfSignup.length > 0) {
      for (let benefit of globalSettings.benefitsOfSignup) {
        if (benefit.icon) {
          benefit.icon = await preSigner(benefit, 'icon')
        }
      }
    }
    return res.status(200).send(globalSettings)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getGlobalSettings = getGlobalSettings

const updateGlobalSettings = async (req, res) => {
  try {
    const fileNamesArray = [
      'websiteLogo',
      'retinaLogo',
      'favicon',
      'bangaloreImage',
      'puneImage',
      'delhiImage',
      'mumbaiImage',
      'onlineImage',
    ]
    const globalSettings = await globalSettingsModel.findOne({})
    if (!globalSettings) {
      const newGlobalSettings = new globalSettingsModel({
        ...req.body,
      })
      if (req.files) {
        for (let fileName of fileNamesArray) {
          if (req.files[fileName]) {
            newGlobalSettings[fileName] = req.files[fileName][0].key
          }
        }
      }
      if (req.files?.benefitsOfSignupIcon) {
        req.files.benefitsOfSignupIcon.forEach((file, index) => {
          newGlobalSettings.benefitsOfSignup[index].icon = file.key
        })
      }
      await newGlobalSettings.save()
      return res.status(200).send(newGlobalSettings)
    }
    const excludedFields = ['_id']
    let updates = Object.keys(req.body)
    updates = updates.filter((value) => !excludedFields.includes(value))
    for (let update of updates) {
      globalSettings[update] = req.body[update]
    }
    if (req.files) {
      for (let fileName of fileNamesArray) {
        if (req.files[fileName]) {
          globalSettings[fileName] = req.files[fileName][0].key
        }
      }
    }
    if (req.files?.benefitsOfSignupIcon) {
      req.files.benefitsOfSignupIcon.forEach((file, index) => {
        globalSettings.benefitsOfSignup[index].icon = file.key
      })
    }
    await globalSettings.save()
    return res.status(200).send(globalSettings)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateGlobalSettings = updateGlobalSettings

const getGlobalSettingsFields = async (req, res) => {
  try {
    const fileNamesArray = [
      'websiteLogo',
      'retinaLogo',
      'favicon',
      'bangaloreImage',
      'puneImage',
      'delhiImage',
      'mumbaiImage',
      'onlineImage',
    ]
    if (!req.query.fields) {
      return res.status(400).send({ message: 'Fields not specified.' })
    }
    const requiredFields = req.query.fields.split(',')
    let fileNamesGiven = fileNamesArray.filter((e) => {
      if (requiredFields.includes(e)) {
        return e
      }
    })
    const globalSettings = await globalSettingsModel.findOne({}, requiredFields)
    for (let fileName of fileNamesGiven) {
      if (globalSettings[fileName]) {
        globalSettings[fileName] = await preSigner(globalSettings, fileName)
      }
    }
    if (requiredFields.benefitsOfSignup) {
      if (globalSettings.benefitsOfSignup.length > 0) {
        for (let benefit of globalSettings.benefitsOfSignup) {
          if (benefit.icon) {
            benefit.icon = await preSigner(benefit, 'icon')
          }
        }
      }
    }
    return res.status(200).send(globalSettings)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getGlobalSettingsFields = getGlobalSettingsFields

const getNavigationPages = async (req, res) => {
  try {
    if (req.query.type == 'footer') {
      // const pages = await pageModel
      //   .find({ navigation: 'footer' }, ['_id', 'title', 'navigation', 'navigationCategory', 'pageUrl'])
      //   .sort({ navigationPosition: 1 })
      const pages = await pageModel.aggregate([
        { 
          $match: { 'navigation' : 'footer' } 
        },
        {
          $sort: { navigationPosition: 1 }
        },
        { 
          $group: {
            _id: '$navigationCategory',
            pageDetails: { 
              $push: { 
                _id: '$_id', 
                title: '$title', 
                pageUrl: '$pageUrl',
                navigation: '$navigation',
                navigationCategory: '$navigationCategory',
                navigationPosition: '$navigationPosition'
              } 
            },
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      return res.status(200).send(pages)
    }
    if (req.query.type == 'header') {
      const pages = await pageModel
        .find({ navigation: 'header' }, ['_id', 'title', 'navigation', 'pageUrl'])
        .sort({ navigationPosition: 1 })
      return res.status(200).send(pages)
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getNavigationPages = getNavigationPages

const setNavigationPositions = async (req, res) => {
  try {
    if (req.query.type == 'footer') {
      const { pageIds } = req.body
      for (let i = 0; i < pageIds.length; i++) {
        const page = await pageModel.findOne({
          _id: pageIds[i],
          navigation: 'footer',
        })
        if (page) {
          page.navigationPosition = i + 1
          await page.save()
        }
      }
      return res.status(200).send({ pageIds })
    }
    if (req.query.type == 'header') {
      const { pageIds } = req.body
      for (let i = 0; i < pageIds.length; i++) {
        const page = await pageModel.findOne({
          _id: pageIds[i],
          navigation: 'header',
        })
        if (page) {
          page.navigationPosition = i + 1
          await page.save()
        }
      }
      return res.status(200).send({ pageIds })
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.setNavigationPositions = setNavigationPositions
