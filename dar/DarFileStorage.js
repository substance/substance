import FSStorage from './FSStorage'
import listDir from './_listDir'

const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
const yazl = require('yazl')
const yauzl = require('yauzl')

/*
  This storage is used to store working copies of '.dar' files that are located somewhere else on the file-system.
  Texture will first update the working copy, and then updates (rewrites) the `.dar` file.

  The implementation will be done in three major iterations

  Phase I: bare-metal file-system, without versioning etc.
  - open: `dar` file is unpacked into the corresponding internal folder
  - save: internal folder is packed replacing the 'dar' file
  - new: internal folder is created and somehow seeded
  - saveas: internal folder is updated first (like in the current implementation), then cloned into a new internal folder corresponding
      to the new 'dar' file location, and packing the folder into the target 'dar'

  Phase II: basic versioning
  The idea is to have a `.dar` folder within a `dar` file that contains data used to implement versioning. We will use `hyperdrive` for that
  TODO: flesh out the concept

  Phase III: collaboration
  In addition to `hyperdrive` data we will store Texture DAR changes in the `.dar` folder. E.g., this would allow to merge two `dar` files that have a common
  version in their history.

  Status: Phase I
*/
export default class DarFileStorage {
  constructor (rootDir, baseUrl) {
    this.rootDir = rootDir
    this.baseUrl = baseUrl

    this._internalStorage = new FSStorage()
  }

  read (darpath, cb) {
    // console.log('DarFileStorage::read', darpath)
    /*
      - unpack `dar` file as it is into the corresponding folder replacing an existing one
      - only bare-metal fs
    */
    let id = this._path2Id(darpath)
    let wcDir = this._getWorkingCopyPath(id)
    fsExtra.removeSync(wcDir)
    fsExtra.mkdirpSync(wcDir)
    this._unpack(darpath, wcDir, err => {
      if (err) return cb(err)
      this._internalStorage.read(wcDir, cb)
    })
  }

  write (darpath, rawArchive, cb) { // eslint-disble-line
    let id = this._path2Id(darpath)
    let wcDir = this._getWorkingCopyPath(id)
    this._internalStorage.write(wcDir, rawArchive, err => {
      if (err) return cb(err)
      this._pack(wcDir, darpath, cb)
    })
  }

  clone (darpath, newDarpath, cb) { // eslint-disble-line
    let id = this._path2Id(darpath)
    let wcDir = this._getWorkingCopyPath(id)
    let newId = this._path2Id(newDarpath)
    let newWcDir = this._getWorkingCopyPath(newId)
    this._internalStorage.clone(wcDir, newWcDir, err => {
      if (err) return cb(err)
      this._pack(newWcDir, newDarpath, cb)
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

  _unpack (darpath, wcDir, cb) {
    // console.log('DarFileStorage::_unpack', darpath, wcDir)
    yauzl.open(darpath, { lazyEntries: true }, (err, zipfile) => {
      if (err) cb(err)
      zipfile.readEntry()
      zipfile.on('entry', (entry) => {
        // dir entry
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
        // file entry
        } else {
          // console.log('... unpacking', entry.fileName)
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) throw err
            readStream.on('end', () => {
              zipfile.readEntry()
            })
            let absPath = path.join(wcDir, entry.fileName)
            fsExtra.ensureDirSync(path.dirname(absPath))
            readStream.pipe(fs.createWriteStream(absPath))
          })
        }
      })
      zipfile.on('error', err => {
        cb(err)
      })
      zipfile.once('end', () => {
        cb()
      })
    })
  }

  _pack (wcDir, darpath, cb) {
    // console.log('DarFileStorage::_pack')
    let zipfile = new yazl.ZipFile()
    listDir(wcDir).then(entries => {
      for (let entry of entries) {
        let relPath = path.relative(wcDir, entry.path)
        // console.log('... adding "%s" as %s', entry.path, relPath)
        zipfile.addFile(entry.path, relPath)
      }
      zipfile.outputStream.pipe(fs.createWriteStream(darpath)).on('close', () => {
        cb()
      })
      // call end() after all the files have been added
      zipfile.end()
    }).catch(cb)
  }

  // used by tests
  _getRawArchive (darpath, cb) {
    let id = this._path2Id(darpath)
    let wcDir = this._getWorkingCopyPath(id)
    this._internalStorage.read(wcDir, cb)
  }
}
