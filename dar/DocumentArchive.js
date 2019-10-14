/* globals Blob */
import { forEach, last, uuid, EventEmitter, platform, isString, sendRequest } from '../util'
import { documentHelpers } from '../model'
import { prettyPrintXML } from '../dom'
import { AbstractEditorSession } from '../editor'
import ManifestLoader from './ManifestLoader'

export default class DocumentArchive extends EventEmitter {
  constructor (storage, buffer, context, config) {
    super()
    this.storage = storage
    this.buffer = buffer

    this._archiveId = null
    this._upstreamArchive = null
    this._documents = null
    this._pendingFiles = new Map()
    this._config = config
  }

  addDocument (type, name, xml) {
    let documentId = uuid()
    let documents = this._documents
    let document = this._loadDocument(type, { data: xml }, documents)
    documents[documentId] = document
    this._registerForChanges(document, documentId)
    this._addDocumentRecord(documentId, type, name, documentId + '.xml')
    return documentId
  }

  addAsset (file) {
    let assetId = uuid()
    let [name, ext] = _getNameAndExtension(file.name)
    let filePath = this._getUniqueFileName(name, ext)
    // TODO: this is not ready for collab
    this._manifestSession.transaction(tx => {
      let assetNode = tx.create({
        type: 'asset',
        id: assetId,
        path: filePath,
        assetType: file.type
      })
      documentHelpers.append(tx, ['dar', 'assets'], assetNode.id)
    })
    this.buffer.addBlob(assetId, {
      id: assetId,
      path: filePath,
      blob: file
    })
    // ATTENTION: blob urls are not supported in nodejs
    // and I do not see that this is really necessary
    // For sake of testing we use `PSEUDO-BLOB-URL:${filePath}`
    // so that we can see if the rest of the system is working
    if (platform.inBrowser) {
      this._pendingFiles.set(filePath, {
        blob: file,
        blobUrl: URL.createObjectURL(file)
      })
    } else {
      this._pendingFiles.set(filePath, {
        blob: file,
        blobUrl: `PSEUDO-BLOB-URL:${filePath}`
      })
    }
    return filePath
  }

  replaceAsset (oldFileName, newFile) {
    const asset = this.getAsset(oldFileName)
    let [name, ext] = _getNameAndExtension(newFile.name)
    let filePath = this._getUniqueFileName(name, ext)
    // TODO: this is not ready for collab
    this._manifestSession.transaction(tx => {
      const _asset = tx.get(asset.id)
      _asset.assign({
        path: filePath,
        assetType: newFile.type
      })
    })
    this.buffer.addBlob(asset.id, {
      id: asset.id,
      path: filePath,
      blob: newFile
    })
    // ATTENTION: blob urls are not supported in nodejs
    // and I do not see that this is really necessary
    // For sake of testing we use `PSEUDO-BLOB-URL:${filePath}`
    // so that we can see if the rest of the system is working
    if (platform.inBrowser) {
      this._pendingFiles.set(filePath, {
        blob: newFile,
        blobUrl: URL.createObjectURL(newFile)
      })
    } else {
      this._pendingFiles.set(filePath, {
        blob: newFile,
        blobUrl: `PSEUDO-BLOB-URL:${filePath}`
      })
    }
    return filePath
  }

  getAsset (fileName) {
    return this._documents['manifest'].getAssetByPath(fileName)
  }

  getAssetEntries () {
    return this._documents['manifest'].getAssetNodes().map(node => node.toJSON())
  }

  getBlob (path) {
    // There are the following cases
    // 1. the asset is on a different server (remote url)
    // 2. the asset is on the local server (local url / relative path)
    // 3. an unsaved is present as a blob in memory
    let blobEntry = this._pendingFiles.get(path)
    if (blobEntry) {
      return Promise.resolve(blobEntry.blob)
    } else {
      let fileRecord = this._upstreamArchive.resources[path]
      if (fileRecord) {
        if (fileRecord.encoding === 'url') {
          if (platform.inBrowser) {
            return sendRequest({
              method: 'GET',
              url: fileRecord.data,
              responseType: 'blob'
            })
          } else {
            // TODO: find a better way to provide platform specific implementations
            // This is problematic for webpack because it will try to bundle
            // 'fs' even if this code is never used in the browser
            const fs = require('fs')
            return new Promise((resolve, reject) => {
              fs.readFile(fileRecord.data, (err, data) => {
                if (err) reject(err)
                else resolve(data)
              })
            })
          }
        } else {
          let blob = platform.inBrowser ? new Blob([fileRecord.data]) : fileRecord.data
          return Promise.resolve(blob)
        }
      } else {
        return Promise.reject(new Error('File not found: ' + path))
      }
    }
  }

  getConfig () {
    return this._config
  }

  getDocumentEntries () {
    return this.getDocument('manifest').getDocumentEntries()
  }

  getDownloadLink (fileName) {
    let manifest = this.getDocument('manifest')
    let asset = manifest.getAssetByPath(fileName)
    if (asset) {
      return this.resolveUrl(fileName)
    }
  }

  getDocument (docId) {
    return this._documents[docId]
  }

  hasAsset (fileName) {
    // TODO: at some point I want to introduce an index for files by fileName/path
    return Boolean(this.getAsset(fileName))
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
          let localVersion = buffer.getVersion()
          let upstreamVersion = upstreamArchive.version
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
        let documents = this._ingest(upstreamArchive)
        // contract: there must be a manifest
        if (!documents['manifest']) {
          throw new Error('There must be a manifest.')
        }
        // Creating an EditorSession for the manifest
        this._manifestSession = new AbstractEditorSession('manifest', documents['manifest'])

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
        this._upstreamArchive = upstreamArchive
        this._documents = documents

        cb(null, this)
      })
    })
  }

  removeDocument (documentId) {
    let document = this._documents[documentId]
    if (document) {
      this._unregisterFromDocument(document)
      // TODO: this is not ready for collab
      let manifest = this._documents['manifest']
      documentHelpers.removeFromCollection(manifest, ['dar', 'documents'], documentId)
      documentHelpers.deepDeleteNode(manifest, documentId)
    }
  }

  renameDocument (documentId, name) {
    // TODO: this is not ready for collab
    let manifest = this._documents['manifest']
    let documentNode = manifest.get(documentId)
    documentNode.name = name
  }

  resolveUrl (path) {
    // until saved, files have a blob URL
    let blobEntry = this._pendingFiles.get(path)
    if (blobEntry) {
      return blobEntry.blobUrl
    } else {
      let fileRecord = this._upstreamArchive.resources[path]
      if (fileRecord && fileRecord.encoding === 'url') {
        return fileRecord.data
      }
    }
  }

  save (cb) {
    // FIXME: buffer.hasPendingChanges() is not working
    this.buffer._isDirty['manuscript'] = true
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
    Adds a document record to the manifest file
  */
  _addDocumentRecord (documentId, type, name, path) {
    this._manifestSession.transaction(tx => {
      let documentNode = tx.create({
        type: 'document',
        id: documentId,
        documentType: type,
        name,
        path
      })
      documentHelpers.append(tx, ['dar', 'documents', documentNode.id])
    })
  }

  _getUniqueFileName (name, ext) {
    let candidate
    // first try the canonical one
    candidate = `${name}.${ext}`
    if (this.hasAsset(candidate)) {
      let count = 2
      // now use a suffix counting up
      while (true) {
        candidate = `${name}_${count++}.${ext}`
        if (!this.hasAsset(candidate)) break
      }
    }

    return candidate
  }

  _loadManifest (record) {
    if (!record) {
      throw new Error('manifest.xml is missing')
    }
    return ManifestLoader.load(record.data)
  }

  _registerForAllChanges (documents) {
    forEach(documents, (document, docId) => {
      this._registerForChanges(document, docId)
    })
  }

  _registerForChanges (document, docId) {
    document.on('document:changed', change => {
      this.buffer.addChange(docId, change)
      setTimeout(() => {
        // Apps can subscribe to this (e.g. to show there's pending changes)
        this.emit('archive:changed')
      }, 0)
    }, this)
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

    let rawArchiveUpdate = this._exportChanges(this._documents, buffer)

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
        for (let blobEntry of this._pendingFiles.values()) {
          window.URL.revokeObjectURL(blobEntry.blobUrl)
        }
      }
      this._pendingFiles.clear()

      // After successful save the archiveId may have changed (save as use case)
      this._archiveId = archiveId
      this.emit('archive:saved')
      cb(null, rawArchiveUpdate)
    })
  }

  _unregisterFromDocument (document) {
    document.off(this)
  }

  /*
    Uses the current state of the buffer to generate a rawArchive object
    containing all changed documents
  */
  _exportChanges (documents, buffer) {
    let rawArchive = {
      version: buffer.getVersion(),
      diff: buffer.getChanges(),
      resources: {}
    }
    this._exportManifest(documents, buffer, rawArchive)
    this._exportChangedDocuments(documents, buffer, rawArchive)
    this._exportChangedAssets(documents, buffer, rawArchive)
    return rawArchive
  }

  _exportManifest (documents, buffer, rawArchive) {
    let manifest = documents['manifest']
    if (buffer.hasResourceChanged('manifest')) {
      let manifestDom = manifest.toXML()
      let manifestXmlStr = prettyPrintXML(manifestDom)
      rawArchive.resources['manifest.xml'] = {
        id: 'manifest',
        data: manifestXmlStr,
        encoding: 'utf8',
        updatedAt: Date.now()
      }
    }
  }

  _exportChangedAssets (documents, buffer, rawArchive) {
    let manifest = documents['manifest']
    let assetNodes = manifest.getAssetNodes()
    assetNodes.forEach(asset => {
      let assetId = asset.id
      if (buffer.hasBlobChanged(assetId)) {
        let path = asset.path || assetId
        let blobRecord = buffer.getBlob(assetId)
        rawArchive.resources[path] = {
          assetId,
          data: blobRecord.blob,
          encoding: 'blob',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }
    })
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

    const entries = manifest.getDocumentEntries()
    entries.forEach(entry => {
      const record = rawArchive.resources[entry.path]
      // Note: this happens when a resource is referenced in the manifest
      // but is not there actually
      // we skip loading here and will fix the manuscript later on
      if (!record) return
      // TODO: we need better concept for handling errors
      const document = this._loadDocument(entry.type, record, documents)
      documents[entry.id] = document
    })
    return documents
  }

  _exportChangedDocuments (documents, buffer, rawArchive) {
    // Note: we are only adding resources that have changed
    // and only those which are registered in the manifest
    const entries = this.getDocumentEntries()
    for (const entry of entries) {
      const { id, type, path } = entry
      const hasChanged = buffer.hasResourceChanged(id)
      // skipping unchanged resources
      if (!hasChanged) continue
      // We mark a resource dirty when it has changes
      if (type === 'article') {
        const document = documents[id]
        // TODO: how should we communicate file renamings?
        rawArchive.resources[path] = {
          id,
          data: this._exportDocument(type, document, documents),
          encoding: 'utf8',
          updatedAt: Date.now()
        }
      }
    }
  }

  _loadDocument (type, record, documents) {
    throw new Error('This method is abstract')
  }

  _exportDocument (type, document, documents) { // eslint-disable-line no-unused-vars
    // TODO: same as with loader
    return document.toXml()
  }

  getTitle () {
    // TODO: the name of the 'main' document should not be hard-coded
    const manuscript = this.getDocument('manuscript')
    let title = 'Untitled'
    if (manuscript) {
      title = manuscript.getTitle() || title
    }
    return title
  }

  _getManifestXML (rawArchive) {
    return rawArchive.resources['manifest.xml'].data
  }
}

function _getNameAndExtension (name) {
  let frags = name.split('.')
  let ext = ''
  if (frags.length > 1) {
    ext = last(frags)
    name = frags.slice(0, frags.length - 1).join('.')
  }
  return [name, ext]
}
