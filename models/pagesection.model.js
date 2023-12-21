const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    page: {
      type: String,
      ref: 'Page'
    },
    sectionType: String,
    sectionPosition: Number,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    discriminatorKey: 'sectionType'
  }
)

const textSectionWithImageSchema = new mongoose.Schema({
  imagePosition: {
    type: String,
    enum: ['left', 'right'],
    default: 'right'
  },
  heading: String,
  body: String,
  buttonType: String,
  buttonText: String,
  buttonLink: String,
  image: Object,
})

const imageCarouselSchema = new mongoose.Schema({
  elements: [{
    image: Object,
    caption: String,
  }]
})

const carouselTextWithImagesSchema = new mongoose.Schema({
  pages: [{
    imagePosition: {
      type: String,
      enum: ['left', 'right'],
      default: 'right'
    },
    heading: String,
    body: String,
    buttonType: String,
    buttonText: String,
    buttonLink: String,
    image: Object,
  }]    
})

const heroTextWithImageSchema = new mongoose.Schema({
  imagePosition: {
    type: String,
    enum: ['top', 'bottom-1', 'bottom-2'],
    default: 'top'
  },
  heading: String,
  body: String,
  buttonType: String,
  buttonText: String,
  buttonLink: String,
  image: Object,
})

const callToActionSchema = new mongoose.Schema({
  text: String,
  buttonType: String,
  buttonText: String,
  buttonLink: String,
  image: Object, 
})

const imageWithTextSchema = new mongoose.Schema({
  imagePosition: {
    type: String,
    enum: ['left', 'right'],
    default: 'right'
  },
  mainHeading: String,
  elements: [{
    image: Object,
    imageName: String,
    role: String,
    subHeading: String,
    text: String,
  }]
})

const imageCollageSchema = new mongoose.Schema({
  variant: {
    type: String,
    enum: ['variant-1', 'variant-2'],
    default: 'variant-1'
  },
  text: String,
  images: [Object],
})

const singleImageSchema = new mongoose.Schema({
  image: Object,
})

const cardSliderSchema = new mongoose.Schema({
  variant: {
    type: String,
    enum: ['variant-1', 'variant-2'],
    default: 'variant-1'
  },
  heading: String,
  cards: [{
    image: Object,
    subHeading: String,
    role: String,
    body: String,
  }]
})

const cardsInTwoColumnsSchema = new mongoose.Schema({
  variant: {
    type: String,
    enum: ['variant-1', 'variant-2'],
    default: 'variant-1'
  },
  heading: String,
  body: String,
  cards: [{
    icon: Object,
    subHeading: String,
    body: String,
  }]
})

const highlightsSchema = new mongoose.Schema({
  metrics: [{
    number: Number,
    label: String,
  }]
})

const faqSectionSchema = new mongoose.Schema({
  faqs: [{
    heading: String,
    questions: [{
      question: String,
      answer: String,
    }]
  }]
})

const pointsWithIconsSchema = new mongoose.Schema({
  withImage: {
    type: Boolean,
    default: false
  },
  heading: String,
  image: Object,
  points: [{
    icon: Object,
    body: String
  }]
})

const courseOverviewSchema = new mongoose.Schema({
  heading: String,
  buttonType: String,
  buttonText: String,
  buttonLink: String,
  courses: [{
    type: String,
    ref: 'Course'
  }]
})

const meetupOverviewSchema = new mongoose.Schema({
  variant: {
    type: String,
    enum: ['variant-1', 'variant-2'],
    default: 'variant-1'
  },
  heading: String,
  body: String,
  buttonType: String,
  buttonText: String,
  buttonLink: String,
  primaryElement: {
    type: String,
    ref: ''
  },
  secondaryElements:[{
    type: String,
    ref: ''
  }]
})

const articleOverviewSchema = new mongoose.Schema({
  variant: {
    type: String,
    enum: ['variant-1', 'variant-2'],
    default: 'variant-1'
  },
  heading: String,
  buttonType: String,
  buttonText: String,
  buttonLink: String,
  elements: [{
    type: String,
    ref: ''
  }]
})

const primaryContactSchema = new mongoose.Schema({
  subtitle: String,
  contact: String,
})

const secondaryContactSchema = new mongoose.Schema({
  body: String,
  contacts: [String],
})

const locationCatalogueSchema = new mongoose.Schema({
  locations: [{
    locationName: String,
    personPhoto: Object,
  }],
})

const mapSchema = new mongoose.Schema({
  urls: [String],
})

const formSchema = new mongoose.Schema({
  link: String,
})

// const humanStorySchema = new mongoose.Schema({
//   mainHeading: String,
//   persons: [{
//     nameOfPerson: String,
//     role: String,
//     personPhoto: Object,
//     text: String,
//     subHeading: String,
//   }],
// })

// const pastMeetupSchema = new mongoose.Schema({
//   primaryArticle: String,
//   secondaryArticle: [String],
// })

// const textBasedTestimonialSchema = new mongoose.Schema({
//   heading: String,
//   testimonials: [{
//     body: String,
//     personPhoto: Object,
//     name: String,
//     role: String,
//   }]
// })

// const logoSchema = new mongoose.Schema({
//   heading: String,
//   images: [Object],
// })

// const detauxBannerSchema = new mongoose.Schema({
//   detaux: String,
// })

const PageSection = mongoose.model('PageSection', schema)
const TextSectionWithImage = PageSection.discriminator('TextSectionWithImage', textSectionWithImageSchema)
const ImageCarousel = PageSection.discriminator('ImageCarousel', imageCarouselSchema)
const CarouselTextWithImages = PageSection.discriminator('CarouselTextWithImages', carouselTextWithImagesSchema)
const HeroTextWithImage = PageSection.discriminator('HeroTextWithImage', heroTextWithImageSchema)
const CallToAction = PageSection.discriminator('CallToAction', callToActionSchema)
const ImageWithText = PageSection.discriminator('ImageWithText', imageWithTextSchema)
const ImageCollage = PageSection.discriminator('ImageCollage', imageCollageSchema)
const SingleImage = PageSection.discriminator('SingleImage', singleImageSchema)
const CardSlider = PageSection.discriminator('CardSlider', cardSliderSchema)
const CardsInTwoColumns = PageSection.discriminator('CardsInTwoColumns', cardsInTwoColumnsSchema)
const Highlights = PageSection.discriminator('Highlights', highlightsSchema)
const FaqSection = PageSection.discriminator('FaqSection', faqSectionSchema)
const PointsWithIcons = PageSection.discriminator('PointsWithIcons', pointsWithIconsSchema)
const CourseOverview = PageSection.discriminator('CourseOverview', courseOverviewSchema)
const MeetupOverview = PageSection.discriminator('MeetupOverview', meetupOverviewSchema)
const ArticleOverview = PageSection.discriminator('ArticleOverview', articleOverviewSchema)
const PrimaryContact = PageSection.discriminator('PrimaryContact', primaryContactSchema)
const SecondaryContact = PageSection.discriminator('SecondaryContact', secondaryContactSchema)
const LocationCatalogue = PageSection.discriminator('LocationCatalogue', locationCatalogueSchema)
const Map = PageSection.discriminator('Map', mapSchema)
const Form = PageSection.discriminator('Form', formSchema)
// const HumanStory = PageSection.discriminator('HumanStory', humanStorySchema)
// const PastMeetup = PageSection.discriminator('PastMeetup', pastMeetupSchema)
// const TextBasedTestimonial = PageSection.discriminator('TextBasedTestimonial', textBasedTestimonialSchema)
// const Logo = PageSection.discriminator('Logo', logoSchema)
// const DetauxBanner = PageSection.discriminator('DetauxBanner', detauxBannerSchema)

module.exports = {
  PageSection,
  TextSectionWithImage,
  ImageCarousel,
  CarouselTextWithImages,
  HeroTextWithImage,
  CallToAction,
  ImageWithText,
  ImageCollage,
  SingleImage,
  CardSlider,
  CardsInTwoColumns,
  Highlights,
  FaqSection,
  PointsWithIcons,
  CourseOverview,
  MeetupOverview,
  ArticleOverview,
  PrimaryContact, 
  SecondaryContact,
  LocationCatalogue,
  Map,
  Form,
  // HumanStory,
  // PastMeetup,
  // TextBasedTestimonial,
  // Logo,
  // DetauxBanner,
}