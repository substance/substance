import { DefaultDOMElement } from '../dom'
import writeFile from './_writeFile'

const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')

/**
 * A storage that reads and writes raw archives from the file-system.
 */
export default class RawArchiveFSStorage {
  constructor (rootDir, baseUrl) {
    this._rootDir = rootDir
    this._baseUrl = baseUrl
  }

  read (archiveDir, cb) {
    archiveDir = this._normalizeArchiveDir(archiveDir)
    this._readRawArchiveFromDirectory(archiveDir)
      .then(rawArchive => cb(null, rawArchive))
      .catch(cb)
  }

  write (archiveDir, rawArchive, cb) {
    this._writeArchive(archiveDir, rawArchive)
      .then(() => cb())
      .catch(cb)
  }

  getAssetUrl (archiveDir, asset) {
    return `${this._baseUrl}${path.basename(archiveDir)}/${asset.id}`
  }

  clone (archiveDir, newArchiveDir, cb) {
    // TODO: we should prune the cloned archive
    fsExtra.copy(archiveDir, newArchiveDir)
      .then(() => cb())
      .catch(cb)
  }

  async _getManifest (archiveDir) {
    const manifestRecord = await this._getFileRecord(path.join(archiveDir, 'manifest'), true)
    const manifest = DefaultDOMElement.parseXML(manifestRecord.data)
    return manifest
  }

  _normalizeArchiveDir (archiveDir) {
    if (!path.isAbsolute(archiveDir)) {
      archiveDir = path.join(this._rootDir, archiveDir)
    }
    return archiveDir
  }

  async _readRawArchiveFromDirectory (archiveDir) {
    const manifestRecord = await this._getFileRecord(path.join(archiveDir, 'manifest'), true)
    const manifest = DefaultDOMElement.parseXML(manifestRecord.data)
    // Note: this implementation is not resilient against broken manifest or missing files
    // TODO: instead of making this implementation resilient, we may come up with a 'self-healing' implementation
    const documentRecords = await Promise.all(manifest.findAll('document').map(docEl => this._getFileRecord(path.join(archiveDir, docEl.id), true)))
    const assetRecords = await Promise.all(manifest.findAll('asset').map(assetEl => this._getFileRecord(path.join(archiveDir, assetEl.id), false)))
    const resources = [manifestRecord].concat(documentRecords).concat(assetRecords).reduce((resources, record) => {
      // Note: initially record.filename is an absolute path
      // Within the raw DAR the filename is the id of the resource
      const filePath = record.filename
      const id = path.relative(archiveDir, filePath)
      record.filename = id
      record.id = id
      resources[id] = record
      if (record.encoding === 'url') {
        record.data = this._baseUrl + path.relative(this._rootDir, filePath)
      }
      return resources
    }, {})
    const rawArchive = {
      resources
    }
    return rawArchive
  }

  _getFileRecord (filePath, loadContent) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) return reject(err)
        const size = stats.size
        const createdAt = stats.birthtime.getTime()
        const updatedAt = stats.mtime.getTime()
        const record = {
          filename: filePath,
          size,
          createdAt,
          updatedAt,
          encoding: null,
          data: null
        }
        if (loadContent) {
          fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) return reject(err)
            record.encoding = 'utf8'
            record.data = content
            resolve(record)
          })
        } else {
          record.encoding = 'url'
          record.data = filePath
          resolve(record)
        }
      })
    })
  }

  async _writeArchive (archiveDir, rawArchive) {
    const resources = rawArchive.resources
    for (const resourceId of Object.keys(resources)) {
      const resource = resources[resourceId]
      await this._writeResource(archiveDir, resourceId, resource)
    }
  }

  _writeResource (archiveDir, resourceId, resource) {
    const absPath = path.join(archiveDir, resourceId)
    switch (resource.encoding) {
      case 'utf8': {
        return writeFile(absPath, resource.data, 'utf8')
      }
      case 'blob': {
        return writeFile(absPath, resource.data)
      }
      default:
        throw new Error('Unsupported encoding.')
    }
  }

  // async _convertBlobs (rawArchive) {
  //   const resources = rawArchive.resources
  //   const ids = Object.keys(resources)
  //   for (const id of ids) {
  //     const record = resources[id]
  //     if (record.encoding === 'blob') {
  //       record.data = await this._blobToArrayBuffer(record.data)
  //     }
  //   }
  // }

  // _blobToArrayBuffer (blob) {
  //   return new Promise((resolve, reject) => {
  //     debugger
  //     // TODO: is there other way to get buffer out of Blob without browser APIs?
  //     fs.readFile(blob.path, (err, buffer) => {
  //       if (err) return reject(err)
  //       resolve(buffer)
  //     })
  //   })
  // }
}
