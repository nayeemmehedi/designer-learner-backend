const pageModel = require('../models/page.model')
const courseModel = require('../models/course.model')
const locationModel = require('../models/location.model')
const pageSectionModel = require('../models/pagesection.model').PageSection
const textSectionWithImageModel = require('../models/pagesection.model')
  .TextSectionWithImage
const imageCarouselModel = require('../models/pagesection.model').ImageCarousel
const carouselTextWithImagesModel = require('../models/pagesection.model')
  .CarouselTextWithImages
const heroTextWithImageModel = require('../models/pagesection.model')
  .HeroTextWithImage
const callToActionModel = require('../models/pagesection.model').CallToAction
const imageWithTextModel = require('../models/pagesection.model').ImageWithText
const imageCollageModel = require('../models/pagesection.model').ImageCollage
const singleImageModel = require('../models/pagesection.model').SingleImage
const cardSliderModel = require('../models/pagesection.model').CardSlider
const cardsInTwoColumnsModel = require('../models/pagesection.model')
  .CardsInTwoColumns
const highlightsModel = require('../models/pagesection.model').Highlights
const faqSectionModel = require('../models/pagesection.model').FaqSection
const pointsWithIconsModel = require('../models/pagesection.model')
  .PointsWithIcons
const meetupOverviewModel = require('../models/pagesection.model')
  .MeetupOverview
const courseOverviewModel = require('../models/pagesection.model')
  .CourseOverview
const articleOverviewModel = require('../models/pagesection.model')
  .ArticleOverview
const primaryContactModel = require('../models/pagesection.model')
  .PrimaryContact
const secondaryContactModel = require('../models/pagesection.model')
  .SecondaryContact
const locationCatalogueModel = require('../models/pagesection.model')
  .LocationCatalogue
const mapModel = require('../models/pagesection.model').Map
const formModel = require('../models/pagesection.model').Form
// const humanStoryModel = require('../models/pagesection.model').HumanStory
// const pastMeetupModel = require('../models/pagesection.model').PastMeetup
// const textBasedTestimonialModel = require('../models/pagesection.model').TextBasedTestimonial
// const logoModel = require('../models/pagesection.model').Logo
// const detauxBannerModel = require('../models/pagesection.model').DetauxBanner

const preSigner = require('../utils/urlGenerator.util')

const createPage = async (req, res) => {
  try {
    const page = new pageModel({
      modifierId: req.uid,
      ...req.body,
    })
    await page.save()
    return res.status(200).send(page)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.createPage = createPage

const listPages = async (req, res) => {
  try {
    const pages = await pageModel
      .find({})
      .populate('modifiedBy', ['profilePicture', 'fullName', 'uid'])
    let response = []
    for (let page of pages) {
      const pageJson = page.toJSON()
      if (pageJson?.modifiedBy?.profilePicture) {
        pageJson.modifiedBy.profilePicture = await preSigner(
          pageJson.modifiedBy,
          'profilePicture',
        )
      }
      response.push(pageJson)
    }
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.listPages = listPages

const getOnePage = async (req, res) => {
  try {
    const page = await pageModel
      .findOne({ _id: req.params.id })
      .populate('modifiedBy', ['profilePicture', 'fullName', 'uid'])
    if (page?.modifiedBy?.profilePicture) {
      page.modifiedBy['profilePicture'] = await preSigner(
        page.modifiedBy,
        'profilePicture',
      )
    }
    if (!page) {
      return res.status(404).send('Page not found')
    }
    const pageSections = await pageSectionModel
      .find({ page: page._id })
      .sort({ sectionPosition: 1 })

    const singleImageSections = [
      'TextSectionWithImage',
      'HeroTextWithImage',
      'CallToAction',
      'PointsWithIcons',
      'SingleImage',
    ]

    const multipleImageSections = [
      'CarouselTextWithImages',
      'ImageCarousel',
      'ImageWithText',
      'ImageCollage',
      'CardSlider',
    ]

    const iconSections = ['CardsInTwoColumns', 'PointsWithIcons']

    for (let pageSection of pageSections) {
      if (singleImageSections.includes(pageSection.sectionType)) {
        if (pageSection?.image) {
          pageSection.image = await preSigner(pageSection, 'image')
        }
      }

      if (multipleImageSections.includes(pageSection.sectionType)) {
        if (pageSection.sectionType === 'CarouselTextWithImages') {
          for (let element of pageSection.pages) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageCarousel') {
          for (let element of pageSection.elements) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageWithText') {
          for (let element of pageSection.elements) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'CardSlider') {
          for (let element of pageSection.cards) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageCollage') {
          await Promise.all(
            pageSection.images.map(async (image, index) => {
              if (pageSection?.images[index]) {
                pageSection.images[index] = await preSigner(
                  pageSection.images,
                  index,
                )
              }
            }),
          )
        }
        if (pageSection.sectionType === 'CardSlider') {
          for (let element of pageSection.cards) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageCollage') {
          await Promise.all(
            pageSection.images.map(async (image, index) => {
              if (pageSection?.images[index]) {
                pageSection.images[index] = await preSigner(
                  pageSection.images,
                  index,
                )
              }
            }),
          )
        }
      }

      if (pageSection.sectionType === 'LocationCatalogue') {
        for (let location of pageSection.locations) {
          if (location?.personPhoto) {
            location.personPhoto = await preSigner(location, 'personPhoto')
          }
        }
      }

      if (iconSections.includes(pageSection.sectionType)) {
        if (pageSection.sectionType === 'PointsWithIcons') {
          for (let point of pageSection.points) {
            if (point?.icon) {
              point.icon = await preSigner(point, 'icon')
            }
          }
        }
        if (pageSection.sectionType === 'CardsInTwoColumns') {
          for (let card of pageSection.cards) {
            if (card?.icon) {
              card.icon = await preSigner(card, 'icon')
            }
          }
        }
      }
    }

    page._doc.sections = pageSections
    return res.status(200).send(page)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOnePage = getOnePage

const updatePage = async (req, res) => {
  try {
    const page = await pageModel.findOne({ _id: req.params.id })
    if (!page) {
      return res.status(404).send('Page not found')
    }
    const pageUpdates = Object.keys(req.body)
    for (let pageUpdate of pageUpdates) {
      page[pageUpdate] = req.body[pageUpdate]
    }
    page.modifierId = req.uid
    await page.save()
    return res.status(200).send(page)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updatePage = updatePage

const removePage = async (req, res) => {
  try {
    const page = await pageModel.findOne(req.params.id)
    if (!page) {
      return res.status(404).send('Page not found')
    }
    await pageSectionModel.deleteMany({ page: page._id })
    await page.remove()
    return res.status(200).send(page)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.removePage = removePage

const createSection = async (req, res) => {
  try {
    const page = await pageModel.findOne({ _id: req.params.id })
    if (!page) {
      return res.status(404).send('Page not found')
    }

    const modelMaps = {
      TextSectionWithImage: textSectionWithImageModel,
      ImageCarousel: imageCarouselModel,
      CarouselTextWithImages: carouselTextWithImagesModel,
      HeroTextWithImage: heroTextWithImageModel,
      CallToAction: callToActionModel,
      ImageWithText: imageWithTextModel,
      ImageCollage: imageCollageModel,
      SingleImage: singleImageModel,
      CardSlider: cardSliderModel,
      CardsInTwoColumns: cardsInTwoColumnsModel,
      Highlights: highlightsModel,
      FaqSection: faqSectionModel,
      PointsWithIcons: pointsWithIconsModel,
      MeetupOverview: meetupOverviewModel,
      CourseOverview: courseOverviewModel,
      ArticleOverview: articleOverviewModel,
      PrimaryContact: primaryContactModel,
      SecondaryContact: secondaryContactModel,
      LocationCatalogue: locationCatalogueModel,
      Map: mapModel,
      Form: formModel,
      // 'HumanStory': humanStoryModel,
      // 'PastMeetup': pastMeetupModel,
      // 'TextBasedTestimonial': textBasedTestimonialModel,
      // 'Logo': logoModel,
      // 'DetauxBanner': detauxBannerModel,
    }

    const model = modelMaps[req.body.sectionType]
    var pageSection = new model({
      page: page._id.toString(),
      ...req.body,
    })

    page.modifierId = req.uid
    await page.save()
    await pageSection.save()
    return res.status(200).send(pageSection)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.createSection = createSection

const updateSection = async (req, res) => {
  try {
    if (req.body?.__v) {
      delete req.body.__v
    }
    const page = await pageModel.findOne({ _id: req.params.id })
    if (!page) {
      return res.status(404).send('Page not found')
    }
    const pageSection = await pageSectionModel.findOne({
      _id: req.params.sectionId,
      page: req.params.id,
    })
    if (!pageSection) {
      return res.status(404).send('Page section not found')
    }

    const updates = Object.keys(req.body)

    for (let update of updates) {
      pageSection[update] = req.body[update]
    }

    page.modifierId = req.uid
    await page.save()
    await pageSection.save()
    return res.status(200).send(pageSection)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.updateSection = updateSection

const removeSection = async (req, res) => {
  try {
    const page = await pageModel.findOne({ _id: req.params.id })
    if (!page) {
      return res.status(404).send('Page not found')
    }
    const section = await pageSectionModel.findOne({
      _id: req.params.sectionId,
      page: req.params.id,
    })
    if (!section) {
      return res.status(404).send('Section not found')
    }
    page.modifierId = req.uid
    await page.save()
    await section.remove()
    return res.status(200).send(section)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.removeSection = removeSection

const filterPages = async (req, res) => {
  try {
    const filter = {}
    if (req.query.navigation) {
      filter.navigation = req.query.navigation
    }
    if (req.query.type) {
      filter.pageType = req.query.pageType
    }
    if (req.query.status) {
      filter.status = req.query.status
    }
    const pages = await pageModel
      .find(filter)
      .populate('modifiedBy', ['profilePicture', 'fullName', 'uid'])
    let response = []
    for (let page of pages) {
      const pageJson = page.toJSON()
      if (pageJson?.modifiedBy?.profilePicture) {
        pageJson.modifiedBy.profilePicture = await preSigner(
          pageJson.modifiedBy,
          'profilePicture',
        )
      }
      response.push(pageJson)
    }
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.filterPages = filterPages

const getPageFromUrl = async (req, res) => {
  try {
    const page = await pageModel.findOne({ pageUrl: req.params.page })
    if (!page) {
      return res.status(404).send('Page not found')
    }
    const pageSections = await pageSectionModel
      .find({ page: page._id })
      .sort({ sectionPosition: 1 })

    const singleImageSections = [
      'TextSectionWithImage',
      'HeroTextWithImage',
      'CallToAction',
      'PointsWithIcons',
      'SingleImage',
    ]

    const multipleImageSections = [
      'CarouselTextWithImages',
      'ImageCarousel',
      'ImageWithText',
      'ImageCollage',
      'CardSlider',
    ]

    const iconSections = ['CardsInTwoColumns', 'PointsWithIcons']

    for (let pageSection of pageSections) {
      if (singleImageSections.includes(pageSection.sectionType)) {
        if (pageSection?.image) {
          pageSection.image = await preSigner(pageSection, 'image')
        }
      }

      if (multipleImageSections.includes(pageSection.sectionType)) {
        if (pageSection.sectionType === 'CarouselTextWithImages') {
          for (let element of pageSection.pages) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageCarousel') {
          for (let element of pageSection.elements) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageWithText') {
          for (let element of pageSection.elements) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'CardSlider') {
          for (let element of pageSection.cards) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageCollage') {
          await Promise.all(
            pageSection.images.map(async (image, index) => {
              if (pageSection?.images[index]) {
                pageSection.images[index] = await preSigner(
                  pageSection.images,
                  index,
                )
              }
            }),
          )
        }
        if (pageSection.sectionType === 'CardSlider') {
          for (let element of pageSection.cards) {
            if (element?.image) {
              element.image = await preSigner(element, 'image')
            }
          }
        }
        if (pageSection.sectionType === 'ImageCollage') {
          await Promise.all(
            pageSection.images.map(async (image, index) => {
              if (pageSection?.images[index]) {
                pageSection.images[index] = await preSigner(
                  pageSection.images,
                  index,
                )
              }
            }),
          )
        }
      }

      if (pageSection.sectionType === 'LocationCatalogue') {
        for (let location of pageSection.locations) {
          if (location?.personPhoto) {
            location.personPhoto = await preSigner(location, 'personPhoto')
          }
        }
      }

      if (iconSections.includes(pageSection.sectionType)) {
        if (pageSection.sectionType === 'PointsWithIcons') {
          for (let point of pageSection.points) {
            if (point?.icon) {
              point.icon = await preSigner(point, 'icon')
            }
          }
        }
        if (pageSection.sectionType === 'CardsInTwoColumns') {
          for (let card of pageSection.cards) {
            if (card?.icon) {
              card.icon = await preSigner(card, 'icon')
            }
          }
        }
      }
    }

    page._doc.sections = pageSections
    return res.status(200).send(page)
    return res.status(200).send({ api })
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getPageFromUrl = getPageFromUrl

const getItemFromUrl = async (req, res) => {
  try {
    const modelMaps = {
      courses: courseModel,
      locations: locationModel,
    }
    const model = modelMaps[req.params.pageType]
    if (!model) {
      return res.status(404).send('Page not found')
    }
    const item = await model.findOne({ URL: req.params.url })
    if (!item) {
      return res.status(404).send('Page not found')
    }
    const api = `/api/learner/${req.params.pageType}/${item._id}`
    return res.status(200).send({ api })
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getItemFromUrl = getItemFromUrl
