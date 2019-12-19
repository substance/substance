import ManifestLoader from './ManifestLoader'

export default class VfsStorageClient {
  constructor (vfs, baseUrl, options = {}) {
    this.vfs = vfs

    // an url from where the assets are served statically
    this.baseUrl = baseUrl
    this.options = options
  }

  read (archiveId, cb) {
    const rawArchive = _readRawArchive(this.vfs, archiveId, this.baseUrl)
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
  const manifestXML = fs.readFileSync(`${archiveId}/manifest.xml`)
  const manifest = ManifestLoader.load(manifestXML)
  const docs = manifest.getDocumentNodes()
  const assets = manifest.getAssetNodes()
  const rawArchive = {
    version: '0',
    resources: {
      manifest: {
        id: 'manifest',
        filename: 'manifest.xml',
        encoding: 'utf8',
        data: manifestXML
      }
    }
  }

  docs.forEach(entry => {
    const { id, filename } = entry
    if (fs.existsSync(`${archiveId}/${filename}`)) {
      const content = fs.readFileSync(`${archiveId}/${filename}`)
      rawArchive.resources[id] = {
        id,
        filename,
        encoding: 'utf8',
        data: content
      }
    } else {
      console.warn(`${archiveId}/${filename} not found in vfs`)
    }
  })
  assets.forEach(asset => {
    const { id, filename } = asset
    // TODO: we could store other stats and maybe mime-types in VFS
    rawArchive.resources[id] = {
      id,
      filename,
      encoding: 'url',
      data: baseUrl + archiveId + '/' + filename
    }
  })
  return rawArchive
}

function _updateRawArchive (fs, archiveId, rawArchive, baseUrl = '') {
  const ids = Object.keys(rawArchive.resources)
  for (const id of ids) {
    const resource = rawArchive.resources[id]
    const data = resource.data
    fs.writeFileSync(`${archiveId}/${resource.filename}`, data)
  }
}
