import { forEach, last, uuid, EventEmitter, platform, isString } from '../util'
import { documentHelpers, DocumentIndex } from '../model'
import { AbstractEditorSession } from '../editor'
import ManifestLoader from './ManifestLoader'

export default class DocumentArchive extends EventEmitter {
  constructor (storage, buffer, context, config) {
    super()
    this.storage = storage
    this.buffer = buffer

    this._config = config
    this._archiveId = null
    this._documents = null
    this._pendingFiles = new Map()
    this._assetRefs = new AssetRefCountIndex()
  }

  _loadDocument (type, record, documents) {
    const loader = this._config.getDocumentLoader(type)
    if (!loader) {
      const msg = `No loader defined for document type ${type}`
      console.error(msg, type, record)
      throw new Error(msg)
    }
    const doc = loader.load(record.data, { archive: this, config: this._config })
    return doc
  }

  addDocument (type, name, xml) {
    const documentId = uuid()
    const documents = this._documents
    const document = this._loadDocument(type, { data: xml }, documents)
    documents[documentId] = document
    this._registerForChanges(document, documentId)
    this._addDocumentRecord(documentId, type, name, documentId + '.xml')
    return documentId
  }

  addAsset (file, blob) {
    // sometimes it is desired to override the native file data e.g. file.name
    // in that case, you can provide the file data seperate from the blob
    if (!blob) blob = file
    const filename = file.name
    if (this.isFilenameUsed(filename)) {
      throw new Error('A file with this name already exists: ' + filename)
    }
    let assetId
    this._manifestSession.transaction(tx => {
      const assetNode = tx.create({
        type: 'asset',
        id: assetId,
        filename,
        mimetype: file.type
      })
      assetId = assetNode.id
      documentHelpers.append(tx, ['dar', 'assets'], assetId)
    })
    this.buffer.addBlob(assetId, {
      id: assetId,
      filename,
      blob
    })
    // NOTE: blob urls are not supported in nodejs and I do not see that this is really necessary
    // For sake of testing we use `PSEUDO-BLOB-URL:${filePath}`
    // so that we can see if the rest of the system is working
    const blobUrl = platform.inBrowser ? URL.createObjectURL(blob) : `PSEUDO-BLOB-URL:${filename}`
    this._pendingFiles.set(assetId, {
      id: assetId,
      filename,
      blob,
      blobUrl
    })
    return assetId
  }

  getFilename (resourceId) {
    const resource = this._documents.manifest.get(resourceId)
    if (resource) {
      return resource.filename
    }
  }

  getAssetById (assetId) {
    return this._documents.manifest.get(assetId)
  }

  getAssetForFilename (filename) {
    return this._documents.manifest.getAssetByFilename(filename)
  }

  getAssetEntries () {
    return this._documents.manifest.getAssetNodes().map(node => node.toJSON())
  }

  renameAsset (assetId, newFilename) {
    const asset = this.getAssetById(assetId)
    if (!asset) {
      throw new Error(`No asset is registered with id ${assetId}`)
    }
    if (this.isFilenameUsed(newFilename)) {
      throw new Error('A file with this name already exists: ' + newFilename)
    }
    this._manifestSession.transaction(tx => {
      tx.set([asset.id, 'filename'], newFilename)
    })
  }

  getBlob (assetId) {
    // There are the following cases
    // 1. the asset is on a different server (remote url)
    // 2. the asset is on the local server (local url / relative path)
    // 3. an unsaved is present as a blob in memory
    const blobEntry = this._pendingFiles.get(assetId)
    if (blobEntry) {
      return Promise.resolve(blobEntry.blob)
    } else {
      return new Promise((resolve, reject) => {
        this.storage.getAssetBlob(this._archiveId, assetId, (err, buffer) => {
          if (err) {
            reject(err)
          } else {
            resolve(buffer)
          }
        })
      })
    }
  }

  getConfig () {
    return this._config
  }

  getDocumentEntries () {
    return this.getDocument('manifest').getDocumentEntries()
  }

  getDownloadLink (filename) {
    const manifest = this.getDocument('manifest')
    const asset = manifest.getAssetByFilename(filename)
    if (asset) {
      return this.resolveUrl(filename)
    }
  }

  getDocument (docId) {
    return this._documents[docId]
  }

  getDocuments () {
    return this.getDocumentEntries().map(entry => this._documents[entry.id]).filter(Boolean)
  }

  getManifestSession () {
    return this._manifestSession
  }

  isFilenameUsed (filename) {
    // check all document entries and referenced assets if the filename
    // TODO: this could be optimized by keeping a set of used filenames up-to-date
    for (const entry of this.getDocumentEntries()) {
      if (entry.filename === filename) return true
    }
    const assetIds = this._assetRefs.getReferencedAssetIds()
    for (const assetId of assetIds) {
      const asset = this.getAssetById(assetId)
      if (asset) {
        if (asset.filename === filename) return true
      }
    }
  }

  hasPendingChanges () {
    return this.buffer.hasPendingChanges()
  }

  load (archiveId, cb) {
    const storage = this.storage
    const buffer = this.buffer
    storage.read(archiveId, (err, upstreamArchive) => {
      if (err) return cb(err)
      buffer.load(archiveId, err => {
        if (err) return cb(err)
        // Ensure that the upstream version is compatible with the buffer.
        // The buffer may contain pending changes.
        // In this case the buffer should be based on the same version
        // as the latest version in the storage.
        if (!buffer.hasPendingChanges()) {
          const localVersion = buffer.getVersion()
          const upstreamVersion = upstreamArchive.version
          if (localVersion && upstreamVersion && localVersion !== upstreamVersion) {
            // If the local version is out-of-date, it would be necessary to 'rebase' the
            // local changes.
            console.error('Upstream document has changed. Discarding local changes')
            this.buffer.reset(upstreamVersion)
          } else {
            buffer.reset(upstreamVersion)
          }
        }
        // convert raw archive to documents (=ingestion)
        const documents = this._ingest(upstreamArchive)
        // contract: there must be a manifest
        if (!documents.manifest) {
          throw new Error('There must be a manifest.')
        }
        // Creating an EditorSession for the manifest
        this._manifestSession = new AbstractEditorSession('manifest', documents.manifest)

        // apply pending changes
        if (!buffer.hasPendingChanges()) {
          // TODO: when we have a persisted buffer we need to apply all pending
          // changes.
          // For now, we always start with a fresh buffer
        } else {
          buffer.reset(upstreamArchive.version)
        }
        // register for any changes in each document
        this._registerForAllChanges(documents)

        this._archiveId = archiveId
        this._documents = documents

        cb(null, this)
      })
    })
  }

  removeDocument (documentId) {
    const document = this._documents[documentId]
    if (document) {
      this._unregisterFromDocument(document)
      // TODO: this is not ready for collab
      const manifest = this._documents.manifest
      documentHelpers.removeFromCollection(manifest, ['dar', 'documents'], documentId)
      documentHelpers.deepDeleteNode(manifest, documentId)
    }
  }

  renameDocument (documentId, name) {
    // TODO: this is not ready for collab
    const manifest = this._documents.manifest
    const documentNode = manifest.get(documentId)
    documentNode.name = name
  }

  resolveUrl (idOrFilename) {
    // console.log('Resolving url for', idOrFilename)
    let url = null
    const asset = this.getAssetById(idOrFilename) || this.getAssetForFilename(idOrFilename)
    if (asset) {
      // until saved, files have a blob URL
      const blobEntry = this._pendingFiles.get(asset.id)
      if (blobEntry) {
        url = blobEntry.blobUrl
      } else {
        // Note: arguments for getAssetUrl() must be serializable as this is an RPC
        url = this.storage.getAssetUrl(this._archiveId, { id: asset.id, filename: asset.filename })
      }
    }
    // console.log('... url =', url)
    return url
  }

  save (cb) {
    // FIXME: buffer.hasPendingChanges() is not working
    this.buffer._isDirty.manuscript = true
    this._save(this._archiveId, cb)
  }

  /*
    Save as is implemented as follows.

    1. clone: copy all files from original archive to new archive (backend)
    2. save: perform a regular save using user buffer (over new archive, including pending
       documents and blobs)
  */
  saveAs (newArchiveId, cb) {
    this.storage.clone(this._archiveId, newArchiveId, (err) => {
      if (err) return cb(err)
      this._save(newArchiveId, cb)
    })
  }

  /*
    Adds a document record to the manifest
  */
  _addDocumentRecord (documentId, type, name, filename) {
    this._manifestSession.transaction(tx => {
      const documentNode = tx.create({
        type: 'document',
        id: documentId,
        documentType: type,
        name,
        filename
      })
      documentHelpers.append(tx, ['dar', 'documents', documentNode.id])
    })
  }

  getUniqueFileName (filename) {
    const [name, ext] = _getNameAndExtension(filename)
    let candidate
    // first try the canonical one
    candidate = `${name}.${ext}`
    if (this.isFilenameUsed(candidate)) {
      let count = 2
      // now use a suffix counting up
      while (true) {
        candidate = `${name}_${count++}.${ext}`
        if (!this.isFilenameUsed(candidate)) break
      }
    }

    return candidate
  }

  _loadManifest (record) {
    return ManifestLoader.load(record.data)
  }

  _registerForAllChanges (documents) {
    forEach(documents, (document, docId) => {
      this._registerForChanges(document, docId)
    })
  }

  _registerForChanges (doc, docId) {
    // record any change to allow for incremental synchronisation, or storage of incremental data
    doc.on('document:changed', change => {
      this.buffer.addChange(docId, change)
      setTimeout(() => {
        // Apps can subscribe to this (e.g. to show there's pending changes)
        this.emit('archive:changed')
      }, 0)
    }, this)
    // add an index for counting refs to assets
    doc.addIndex('_assetRefs', this._assetRefs)
  }

  _repair () {
    // no-op
  }

  /*
    Create a raw archive for upload from the changed resources.
  */
  _save (archiveId, cb) {
    const buffer = this.buffer
    const storage = this.storage

    this._exportChanges(this._documents, buffer)
      .then(rawArchiveUpdate => {
        // CHALLENGE: we either need to lock the buffer, so that
        // new changes are interfering with ongoing sync
        // or we need something pretty smart caching changes until the
        // sync has succeeded or failed, e.g. we could use a second buffer in the meantime
        // probably a fast first-level buffer (in-mem) is necessary anyways, even in conjunction with
        // a slower persisted buffer
        storage.write(archiveId, rawArchiveUpdate, (err, res) => {
          // TODO: this need to implemented in a more robust fashion
          // i.e. we should only reset the buffer if storage.write was successful
          if (err) return cb(err)

          // TODO: if successful we should receive the new version as response
          // and then we can reset the buffer
          let _res = { version: '0' }
          if (isString(res)) {
            try {
              _res = JSON.parse(res)
            } catch (err) {
              console.error('Invalid response from storage.write()')
            }
          }
          // console.log('Saved. New version:', res.version)
          buffer.reset(_res.version)
          // revoking object urls
          if (platform.inBrowser) {
            for (const blobEntry of this._pendingFiles.values()) {
              window.URL.revokeObjectURL(blobEntry.blobUrl)
            }
          }
          this._pendingFiles.clear()

          // After successful save the archiveId may have changed (save as use case)
          this._archiveId = archiveId
          this.emit('archive:saved')
          cb(null, rawArchiveUpdate)
        })
      })
      .catch(cb)
  }

  _unregisterFromDocument (document) {
    document.off(this)
  }

  /*
    Uses the current state of the buffer to generate a rawArchive object
    containing all changed documents
  */
  async _exportChanges (documents, buffer) {
    const resources = {}
    const manifestUpdate = this._exportManifest(documents, buffer)
    if (manifestUpdate) {
      resources.manifest = manifestUpdate
    }
    Object.assign(resources, this._exportChangedDocuments(documents, buffer))
    const assetUpdates = await this._exportChangedAssets(documents, buffer)
    Object.assign(resources, assetUpdates)
    const rawArchive = {
      resources,
      version: buffer.getVersion(),
      diff: buffer.getChanges()
    }
    return rawArchive
  }

  _exportManifest (documents, buffer, rawArchive) {
    const manifest = documents.manifest
    if (buffer.hasResourceChanged('manifest')) {
      const manifestXmlStr = manifest.toXml({ assetRefIndex: this._assetRefs, prettyPrint: true })
      return {
        id: 'manifest',
        filename: 'manifest.xml',
        data: manifestXmlStr,
        encoding: 'utf8',
        updatedAt: Date.now()
      }
    }
  }

  async _exportChangedAssets (documents, buffer) {
    const manifest = documents.manifest
    const assetNodes = manifest.getAssetNodes()
    const resources = {}
    for (const asset of assetNodes) {
      const assetId = asset.id
      if (buffer.hasBlobChanged(assetId)) {
        const filename = asset.filename || assetId
        const blobRecord = buffer.getBlob(assetId)
        // convert the blob into an array buffer
        // so that it can be serialized correctly
        const data = await blobRecord.blob.arrayBuffer()
        resources[assetId] = {
          id: assetId,
          filename,
          data,
          encoding: 'blob',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }
    }
    return resources
  }

  _exportChangedDocuments (documents, buffer, rawArchive) {
    // Note: we are only adding resources that have changed
    // and only those which are registered in the manifest
    const entries = this.getDocumentEntries()
    const resources = {}
    for (const entry of entries) {
      const { id, type, filename } = entry
      const document = documents[id]
      // TODO: how should we communicate file renamings?
      resources[id] = {
        id,
        filename,
        data: this._exportDocument(type, document, documents),
        encoding: 'utf8',
        updatedAt: Date.now()
      }
    }
    return resources
  }

  _exportDocument (type, document, documents) { // eslint-disable-line no-unused-vars
    // TODO: we need better concept for handling errors
    const context = { archive: this, config: this._config }
    const options = { prettyPrint: true }
    return document.toXml(context, options)
  }

  _getManifestXML (rawArchive) {
    return rawArchive.resources.manifest.data
  }

  /*
    Creates EditorSessions from a raw archive.
    This might involve some consolidation and ingestion.
    */
  _ingest (rawArchive) {
    const documents = {}
    const manifestXML = this._getManifestXML(rawArchive)
    const manifest = this._loadManifest({ data: manifestXML })
    documents.manifest = manifest

    // HACK: assigning loaded documents here already, so that loaders can
    // access other documents, e.g. the manifest
    this._documents = documents

    const entries = manifest.getDocumentEntries()
    entries.forEach(entry => {
      const id = entry.id
      const record = rawArchive.resources[id]
      // Note: this happens when a resource is referenced in the manifest
      // but is not there actually
      // we skip loading here and will fix the manuscript later on
      if (!record) return
      // TODO: we need better concept for handling errors
      const document = this._loadDocument(entry.type, record, documents)
      documents[id] = document
    })
    return documents
  }
}

function _getNameAndExtension (name) {
  const frags = name.split('.')
  let ext = ''
  if (frags.length > 1) {
    ext = last(frags)
    name = frags.slice(0, frags.length - 1).join('.')
  }
  return [name, ext]
}

class AssetRefCountIndex extends DocumentIndex {
  constructor () {
    super()

    this._refCounts = new Map()
  }

  select (node) {
    return node.isInstanceOf('@asset')
  }

  clear () {
    this._refCounts = new Map()
  }

  create (node) {
    this._incRef(node.src)
  }

  delete (node) {
    this._decRef(node.src)
  }

  update (node, path, newValue, oldValue) {
    if (path[1] === 'src') {
      this._decRef(oldValue)
      this._incRef(newValue)
    }
  }

  getReferencedAssetIds () {
    const ids = []
    for (const [id, count] of this._refCounts.entries()) {
      if (count > 0) {
        ids.push(id)
      }
    }
    return ids
  }

  hasRef (assetId) {
    return this._refCounts.has(assetId) && this._refCounts.get(assetId) > 0
  }

  _incRef (assetId) {
    if (!assetId) return
    let refCount = 0
    if (this._refCounts.has(assetId)) {
      refCount = this._refCounts.get(assetId)
    }
    refCount = Math.max(0, refCount + 1)
    this._refCounts.set(assetId, refCount)
  }

  _decRef (assetId) {
    if (!assetId) return
    if (this._refCounts.has(assetId)) {
      const refCount = Math.max(0, this._refCounts.get(assetId) - 1)
      this._refCounts.set(assetId, refCount)
    }
  }
}
