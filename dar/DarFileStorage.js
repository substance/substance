import { DefaultDOMElement } from '../dom'
import RawArchiveFSStorage from './RawArchiveFSStorage'

const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
const yazl = require('yazl')
const yauzl = require('yauzl')

/**
 * A storage that loads and writes to .dar files (zip)
 * unpacking the content into an internal folder in the raw archive presentation.
 */
export default class DarFileStorage {
  constructor (rootDir, baseUrl) {
    this.rootDir = rootDir

    this._internalStorage = new RawArchiveFSStorage(rootDir, baseUrl)
  }

  read (darpath, cb) {
    // console.log('DarFileStorage::read', darpath)
    const id = this._path2Id(darpath)
    const wcDir = this._getWorkingCopyPath(id)
    // ATTENTION: clearing the working dir when opening a DAR
    // ATM this is mainly because we can not 'trust' that the DAR
    // belongs to the actual working dir.
    fsExtra.remove(wcDir, err => {
      if (err) return cb(err)
      fsExtra.mkdirp(wcDir, err => {
        if (err) return cb(err)
        this._unpack(darpath, wcDir)
          .then(() => {
            this._internalStorage.read(wcDir, cb)
          })
          .catch(cb)
      })
    })
  }

  write (darpath, rawArchive, cb) { // eslint-disble-line
    const id = this._path2Id(darpath)
    const wcDir = this._getWorkingCopyPath(id)
    this._internalStorage.write(wcDir, rawArchive, err => {
      if (err) return cb(err)
      this._pack(wcDir, darpath)
        .then(() => cb())
        .catch(cb)
    })
  }

  clone (darpath, newDarpath, cb) { // eslint-disble-line
    const id = this._path2Id(darpath)
    const wcDir = this._getWorkingCopyPath(id)
    const newId = this._path2Id(newDarpath)
    const newWcDir = this._getWorkingCopyPath(newId)
    this._internalStorage.clone(wcDir, newWcDir, err => {
      if (err) return cb(err)
      this._pack(newWcDir, newDarpath)
        .then(() => cb())
        .catch(cb)
    })
  }

  _path2Id (darpath) {
    darpath = String(darpath)
    darpath = path.normalize(darpath)
    // convert: '\\' to '/'
    darpath = darpath.replace(/\\+/g, '/')
    // split path into fragments: dir, name, extension
    let { dir, name } = path.parse(darpath)
    // ATTENTION: it is probably possible to create collisions here if somebody uses '@' in a bad way.
    // For now, this is acceptable because it is not realistic.
    // Adding an extra slash that got dropped by path.parse().
    dir += '/'
    // replace '/' with '@slash@'
    dir = dir.replace(/\//g, '@slash@')
    // replace ':' with '@colon@'
    dir = dir.replace(/:/g, '@colon@')
    return dir + name
  }

  _getWorkingCopyPath (id) {
    return path.join(this.rootDir, id)
  }

  async _unpack (darpath, wcDir) {
    const manifestXML = await this._readManifest(darpath)
    await this._extractRawArchive(darpath, wcDir, manifestXML)
  }

  _readManifest (darpath) {
    return new Promise((resolve, reject) => {
      yauzl.open(darpath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          return reject(err)
        }
        zipfile.readEntry()
        zipfile.on('entry', (entry) => {
          if (entry.fileName === 'manifest.xml') {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) throw err
              const chunks = []
              readStream.on('data', chunk => chunks.push(chunk))
              readStream.on('end', () => {
                zipfile.close()
                resolve(Buffer.concat(chunks).toString())
              })
            })
          } else {
            zipfile.readEntry()
          }
        })
        zipfile.on('error', reject)
        zipfile.once('end', () => {
          reject(new Error('Could not find manifest.xml'))
        })
      })
    })
  }

  _extractRawArchive (darpath, rawArchiveDir, manifestXML) {
    return new Promise((resolve, reject) => {
      const manifest = DefaultDOMElement.parseXML(manifestXML)
      const resourceMap = new Map()
      resourceMap.set('manifest.xml', 'manifest')
      // extract filenames to id mapping
      const resourceEls = manifest.findAll('document, asset')
      for (const resourceEl of resourceEls) {
        const filename = resourceEl.getAttribute('path')
        const id = resourceEl.getAttribute('id')
        resourceMap.set(filename, id)
      }
      yauzl.open(darpath, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err)
        zipfile.readEntry()
        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            zipfile.readEntry()
          } else {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) throw err
              readStream.on('end', () => {
                zipfile.readEntry()
              })
              // skip all files that are not registered in the manifest
              if (!resourceMap.has(entry.fileName)) {
                zipfile.readEntry()
              } else {
                const id = resourceMap.get(entry.fileName)
                const absPath = path.join(rawArchiveDir, id)
                fsExtra.ensureDirSync(path.dirname(absPath))
                readStream.pipe(fs.createWriteStream(absPath))
              }
            })
          }
        })
        zipfile.on('error', reject)
        zipfile.once('end', () => resolve())
      })
    })
  }

  async _pack (wcDir, darpath) {
    // reading the manifest from the internal storage
    // and then picking all documents and assets (skipping unused)
    // and pack them into a zip file
    const zipfile = new yazl.ZipFile()
    const manifest = await this._internalStorage._getManifest(wcDir)
    zipfile.addFile(path.join(wcDir, 'manifest'), 'manifest.xml')
    for (const docEl of manifest.findAll('document')) {
      const id = docEl.id
      const relPath = docEl.getAttribute('path')
      zipfile.addFile(path.join(wcDir, id), relPath)
    }
    for (const assetEl of manifest.findAll('asset')) {
      const unused = Boolean(assetEl.getAttribute('unused'))
      // skip unused assets
      if (unused) continue
      const id = assetEl.id
      const relPath = assetEl.getAttribute('path')
      zipfile.addFile(path.join(wcDir, id), relPath)
    }
    return new Promise((resolve, reject) => {
      zipfile.outputStream.pipe(fs.createWriteStream(darpath))
        .on('close', resolve)
        .on('error', reject)
      // call end() after all the files have been added
      zipfile.end()
    })
  }

  // used by tests
  _getRawArchive (darpath, cb) {
    const id = this._path2Id(darpath)
    const wcDir = this._getWorkingCopyPath(id)
    this._internalStorage.read(wcDir, cb)
  }
}
