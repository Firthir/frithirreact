const fs = require('fs')
const path = require('path')
const globCb = require('glob')
const util = require('util')
const sharp = require('sharp')

const glob = util.promisify(globCb)
const readFile = util.promisify(fs.readFile)

const options = {
  inputDir: './public/images/uploads',
  outputDir: './public/images/uploads/resized',
  sizes: [300, 600, 1200, 1800],
  imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
}

const saveImage = ({ buffer, size, outputFile }) => {
  return new Promise((resolve, reject) => {
    sharp(buffer)
      .resize(size)
      .toFile(outputFile, err => {
        if (err) {
          return reject(err)
        } else {
          return resolve(console.log(`✅ Saved ${outputFile}`))
        }
      })
  })
}

const saveImages = ({ buffer, filename }) => {
  console.log(`🎞  Processing ${filename}`)
  return Promise.all(
    options.sizes.map(async size => {
      const extname = path.extname(filename)
      const newFilename = `${path.basename(
        filename,
        extname
      )}.${size}${extname}`
      const outputFile = `${options.outputDir}/${newFilename}`
      const fileExists = await doesFileExist({ filename: outputFile })
      if (fileExists) return console.log(`↩️  ${outputFile} exists, skipping`)
      return saveImage({ buffer, size, outputFile })
    })
  )
}

const readFiles = files =>
  Promise.all(
    files.map(async filename => {
      const buffer = await readFile(filename)
      return { filename, buffer }
    })
  )

const doesFileExist = async ({ filename }) => {
  try {
    await readFile(filename)
    return true
  } catch (e) {
    return false
  }
}

const resizeImages = async () => {
  console.log(`✨  Reading image files in ${options.inputDir}`)
  try {
    const fileGlob = `${options.inputDir}/**/**.+(${options.imageFormats.join(
      '|'
    )})`
    const files = await glob(fileGlob)
    const ignore = new RegExp(
      `(${options.sizes.join('|')}).(${options.imageFormats.join('|')})$`
    )
    const filesToResize = files.filter(filename => !filename.match(ignore))
    const imageFiles = await readFiles(filesToResize)
    imageFiles.map(saveImages)
  } catch (e) {
    console.log(e)
  }
}

resizeImages()
