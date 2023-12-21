const testimonialModel = require('../models/testimonial.model')
const preSigner = require('../utils/urlGenerator.util')

const addTestimonial = async (req, res) => {
  try {
    if(!req.files.file){
      return res.status(400).send({message: "Please upload a file"})
    }
    const testimonial = new testimonialModel({
      file: req.files.file[0].key,
      userId: req.body.user,
    })
    await testimonial.save()
    return res.status(200).send(testimonial)
  } catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.addTestimonial = addTestimonial

const getTestimonials = async (req, res) => {
  try {
    const testimonials = await testimonialModel.find({}).populate('user')
    for(let testimonial of testimonials){
      testimonial.file = await preSigner(testimonial, 'file')
    }
    return res.status(200).send(testimonials)
  } catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getTestimonials = getTestimonials

const getOneTestimonial = async (req, res) => {
  try{
    const testimonial = await testimonialModel.findOne({_id: req.params.id}).populate('user')
    if(!testimonial) {
      return res.status(404).send({message: "Testimonial not found"})
    }
    testimonial.file = await preSigner(testimonial, 'file')
    return res.status(200).send(testimonial)
  } catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOneTestimonial = getOneTestimonial

const removeTestimonial = async (req, res) => {
  try {
    const testimonial = await testimonialModel.findOne({_id: req.params.id})
    if(!testimonial) {
      return res.status(404).send({message: "Testimonial not found"})
    }
    await testimonial.remove()
    return res.status(200).send(testimonial)
  } catch(e){
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.removeTestimonial = removeTestimonial