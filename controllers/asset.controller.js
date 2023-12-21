const path = require('path')
const model = require('../models/asset.model')
const preSigner = require('../utils/urlGenerator.util')

const addAsset = async (req, res) => {
  try {
    if (!req.files.file) {
      return res.status(400).send({ message: 'File is required' })
    }
    if (!req.body.assetType) {
      return res.status(400).send({ message: 'Asset type is required' })
    }
    let extension = path.extname(req.files.file[0].key)
    extension = extension.split('.')[1]
    const asset = new model({
      assetType: req.body.assetType,
      name: req.body.name,
      file: req.files.file[0].key,
      fileExtension: extension,
      alternateText: req.body.alternateText,
    })
    await asset.save()
    return res.status(200).send(asset)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.addAsset = addAsset

const getAssets = async (req, res) => {
  try {
    const response = {}
    let filter = {$in: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'mpeg', 'mp4', 'pdf', 'pptx', 'doc', 'fig', 'xd', 'real', 'vf']}
    if(req.query.filter){
      filter = {$in: req.query.filter.split(',')}
    }
    const assets = await model.find({
      assetType: req.query.type,
      fileExtension: filter
    })
    const totalImages = await model.countDocuments({assetType: 'image'})
    const totalVideos = await model.countDocuments({assetType: 'video'})
    const totalIcons = await model.countDocuments({assetType: 'icon'})
    const totalGifs = await model.countDocuments({assetType: 'gif'})
    const totalDocuments = await model.countDocuments({assetType: 'document'})
    const filteredAssets = await model.find({ assetType: req.query.type, fileExtension: filter }).countDocuments()
    for (let asset of assets) {
      asset.file = await preSigner(asset, 'file')
    }
    response.assets = assets
    response.totalImages = totalImages
    response.totalVideos = totalVideos
    response.totalIcons = totalIcons
    response.totalGifs = totalGifs
    response.totalDocuments = totalDocuments
    response.filteredAssets = filteredAssets
    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getAssets = getAssets

const getOneAsset = async (req, res) => {
  try {
    const asset = await model.findOne({ _id: req.params.id })
    if (!asset) {
      return res.status(404).send({ message: 'Asset not found' })
    }
    asset.file = await preSigner(asset, 'file')
    return res.status(200).send(asset)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.getOneAsset = getOneAsset

const removeAsset = async (req, res) => {
  try {
    const asset = await model.findOne({ _id: req.params.id })
    if (!asset) {
      return res.status(404).send({ message: 'Asset not found' })
    }
    await asset.remove()
    return res.status(200).send(asset)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.removeAsset = removeAsset

const searchAsset = async (req, res) => {
  try {
    const response = {}
    const queryString = req.query.q
    const assets = await model
      .find({ assetType: req.query.type, $text: { $search: queryString } })
      .sort({ score: { $meta: 'textScore' } })
    for (let asset of assets) {
      asset.file = await preSigner(asset, 'file')
    }
    const totalImages = await model.countDocuments({assetType: 'image'})
    const totalVideos = await model.countDocuments({assetType: 'video'})
    const totalIcons = await model.countDocuments({assetType: 'icon'})
    const totalGifs = await model.countDocuments({assetType: 'gif'})
    const totalDocuments = await model.countDocuments({assetType: 'document'})
    const filteredAssets = await model.find({ assetType: req.query.type, $text: { $search: queryString } }).countDocuments()

    response.assets = assets
    response.totalImages = totalImages
    response.totalVideos = totalVideos
    response.totalIcons = totalIcons
    response.totalGifs = totalGifs
    response.totalDocuments = totalDocuments
    response.filteredAssets = filteredAssets

    return res.status(200).send(response)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message)
  }
}

module.exports.serarchAssets = searchAsset
