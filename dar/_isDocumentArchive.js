const fs = require('fs')
const path = require('path')

export default async function isDocumentArchive (archiveDir, opts = {}) {
  // assuming it is a DAR if the folder exists and there is a manifest.xml
  return _fileExists(path.join(archiveDir, 'manifest.xml'), opts)
}

function _fileExists (archivePath, opts) {
  return new Promise((resolve, reject) => {
    fs.stat(archivePath, (err, stats) => {
      if (err) reject(err)
      else resolve(stats && stats.isFile())
    })
  })
}
