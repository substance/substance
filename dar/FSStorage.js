import readArchive from './_readArchive'
import writeArchive from './_writeArchive'
import cloneArchive from './_cloneArchive'

const fs = require('fs')
const path = require('path')

/*
  A storage client optimised for Desktop clients

  NOTE: No versioning is done atm, but users can do a git init in their Dar
  folders.
*/
export default class FSStorage {
  constructor (rootDir) {
    this._rootDir = rootDir
  }

  read (archiveDir, cb) {
    archiveDir = this._normalizeArchiveDir(archiveDir)
    readArchive(archiveDir, { noBinaryContent: true, ignoreDotFiles: true })
      .then(rawArchive => {
        // Turn binaries into urls
        Object.keys(rawArchive.resources).forEach(recordPath => {
          const record = rawArchive.resources[recordPath]
          if (record._binary) {
            delete record._binary
            record.encoding = 'url'
            record.data = path.join(archiveDir, record.path)
          }
        })
        cb(null, rawArchive)
      })
      .catch(cb)
  }

  write (archiveDir, rawArchive, cb) {
    archiveDir = this._normalizeArchiveDir(archiveDir)
    _convertBlobs(rawArchive)
      .then(() => {
        return writeArchive(archiveDir, rawArchive)
      })
      .then((version) => {
        cb(null, JSON.stringify({ version }))
      })
      .catch(cb)
  }

  clone (archiveDir, newArchiveDir, cb) {
    archiveDir = this._normalizeArchiveDir(archiveDir)
    newArchiveDir = this._normalizeArchiveDir(newArchiveDir)
    cloneArchive(archiveDir, newArchiveDir)
      .then(success => {
        if (success) cb()
        else cb(new Error('Could not clone archive'))
      })
      .catch(cb)
  }

  _normalizeArchiveDir (archiveDir) {
    if (this._rootDir) {
      archiveDir = path.join(this._rootDir, archiveDir)
    }
    return archiveDir
  }
}

/*
  Convert all blobs to array buffers
*/
async function _convertBlobs (rawArchive) {
  const resources = rawArchive.resources
  const paths = Object.keys(resources)
  for (var i = 0; i < paths.length; i++) {
    const record = resources[paths[i]]
    if (record.encoding === 'blob') {
      record.data = await _blobToArrayBuffer(record.data)
    }
  }
}

function _blobToArrayBuffer (blob) {
  return new Promise((resolve, reject) => {
    // TODO: is there other way to get buffer out of Blob without browser APIs?
    fs.readFile(blob.path, (err, buffer) => {
      if (err) return reject(err)
      resolve(buffer)
    })
  })
}
