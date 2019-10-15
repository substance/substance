import ManifestLoader from './ManifestLoader'

export default class VfsStorageClient {
  constructor (vfs, baseUrl, options = {}) {
    this.vfs = vfs

    // an url rom where the assets are served statically
    this.baseUrl = baseUrl
    this.options = options
  }

  read (archiveId, cb) {
    let rawArchive = _readRawArchive(this.vfs, archiveId, this.baseUrl)
    if (cb) {
      cb(null, rawArchive)
    } else {
      return rawArchive
    }
  }

  write (archiveId, data, cb) { // eslint-disable-line
    if (this.options.writable) {
      _updateRawArchive(this.vfs, archiveId, data, this.baseUrl)
    }
    cb(null, true)
  }
}

function _readRawArchive (fs, archiveId, baseUrl = '') {
  let manifestXML = fs.readFileSync(`${archiveId}/manifest.xml`)
  let manifest = ManifestLoader.load(manifestXML)
  let docs = manifest.getDocumentNodes()
  let assets = manifest.getAssetNodes()
  let rawArchive = {
    version: '0',
    resources: {
      'manifest.xml': {
        encoding: 'utf8',
        data: manifestXML
      }
    }
  }

  docs.forEach(entry => {
    let path = entry.path
    if (fs.existsSync(`${archiveId}/${entry.path}`)) {
      let content = fs.readFileSync(`${archiveId}/${entry.path}`)
      rawArchive.resources[path] = {
        encoding: 'utf8',
        data: content
      }
    } else {
      console.warn(`${archiveId}/${entry.path} not found in vfs`)
    }
  })
  assets.forEach(asset => {
    let path = asset.path
    // TODO: we could store other stats and maybe mime-types in VFS
    rawArchive.resources[path] = {
      encoding: 'url',
      data: baseUrl + archiveId + '/' + path
    }
  })
  return rawArchive
}

function _updateRawArchive (fs, archiveId, rawArchive, baseUrl = '') {
  let paths = Object.keys(rawArchive.resources)
  for (let path of paths) {
    let resource = rawArchive.resources[path]
    let data = resource.data
    fs.writeFileSync(`${archiveId}/${path}`, data)
  }
}
