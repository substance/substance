const fs = require('fs')
const path = require('path')

export default async function writeArchive (archiveDir, rawArchive, opts = {}) {
  const resourceNames = Object.keys(rawArchive.resources)
  const newVersion = '0'

  if (opts.versioning) {
    console.warn('Git based versioning is not yet implemented.')
  }

  return Promise.all(resourceNames.map(f => {
    const record = rawArchive.resources[f]
    const absPath = path.join(archiveDir, f)
    switch (record.encoding) {
      case 'utf8': {
        return _writeFile(fs, absPath, record.data, 'utf8')
      }
      case 'blob': {
        return _writeFile(fs, absPath, record.data)
      }
      // TODO: are there other encodings which we want to support?
      default:
        return false
    }
  })).then(() => {
    return newVersion
  })
}

function _writeFile (fs, p, data, encoding) {
  return new Promise((resolve, reject) => {
    if (typeof data.pipe === 'function') {
      const file = fs.createWriteStream(p)
      data.pipe(file)
      file.on('close', () => {
        resolve()
      })
    } else {
      fs.writeFile(p, data, encoding, (err) => {
        if (err) reject(err)
        else resolve()
      })
    }
  })
}
