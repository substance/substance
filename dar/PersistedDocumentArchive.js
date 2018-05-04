import forEach from '../util/forEach'
import last from '../util/last'
import uuid from '../util/uuid'
import EventEmitter from '../util/EventEmitter'
import ManifestLoader from './ManifestLoader'


/*
  A PersistedDocumentArchive is a 3-tier stack representing a document archive
  at different application levels:

  1. Editor: an application such as Texture works on an in-memory data model,
     managed by EditorSessions. There may be multiple sessions for different parts of the
     document archive, e.g. the manuscript and an entity db.
  2. Buffer: a short-term storage for pending changes. Until the document archive
     is saved permanently, changes are recorded and can be persisted, e.g. to
     avoid loosing changes when the browser is closed inadvertently.
  3. Storage: a long-term storage where the document archive is persisted and versioned.

  PersistedDocumentArchive manages the communication between the three layers, e.g.
  when the user changes a document, it records the change and stores it into the buffer,
  and eventually saving a new version of the ardhive.
*/
export default class PersistedDocumentArchive extends EventEmitter {

  constructor(storage, buffer) {
    super()
    this.storage = storage
    this.buffer = buffer

    this._archiveId = null
    this._upstreamArchive = null
    this._sessions = null
    this._pendingFiles = {}
  }

  hasPendingChanges() {
    return this.buffer.hasPendingChanges()
  }

  createFile(file) {
    let assetId = uuid()
    let fileExtension = last(file.name.split('.'))
    let filePath = `${assetId}.${fileExtension}`
    this._sessions.manifest.transaction(tx => {
      let assets = tx.find('assets')
      let asset = tx.createElement('asset', { id: assetId }).attr({
        path: filePath,
        type: file.type
      })
      assets.appendChild(asset)
    })
    this.buffer.addBlob(assetId, {
      id: assetId,
      path: filePath,
      blob: file
    })
    this._pendingFiles[filePath] = URL.createObjectURL(file)
    return filePath
  }

  /*
    Adds a document record to the manifest file
  */
  _addDocumentRecord(documentId, type, name, path) {
    this._sessions.manifest.transaction(tx => {
      let documents = tx.find('documents')
      let docEntry = tx.createElement('document', { id: documentId }).attr({
        name: name,
        path: path,
        type: type
      })
      documents.appendChild(docEntry)
    })
  }

  addDocument(type, name, xml) {
    let documentId = uuid()
    let sessions = this._sessions
    let session = this._loadDocument(type, { data: xml }, sessions)
    sessions[documentId] = session

    this._registerForSessionChanges(session, documentId)

    this._addDocumentRecord(documentId, type, name, documentId+'.xml')

    return documentId
  }

  removeDocument(documentId) {
    let session = this._sessions[documentId]
    this._unregisterFromSession(session)
    this._sessions.manifest.transaction(tx => {
      let documents = tx.find('documents')
      let docEntry = tx.find(`#${documentId}`)
      documents.removeChild(docEntry)
    })
  }

  renameDocument(documentId, name) {
    this._sessions.manifest.transaction(tx => {
      let docEntry = tx.find(`#${documentId}`)
      docEntry.attr({name})
    })
  }

  getDocumentEntries() {
    return this.getEditorSession('manifest').getDocument().getDocumentEntries()
  }

  resolveUrl(path) {
    let blobUrl = this._pendingFiles[path]
    if (blobUrl) {
      return blobUrl
    } else {
      let fileRecord = this._upstreamArchive.resources[path]
      if (fileRecord && fileRecord.encoding === 'url') {
        return fileRecord.data
      }
    }
  }

  load(archiveId) {
    const storage = this.storage
    const buffer = this.buffer

    let upstreamArchive
    return Promise.resolve()
    .then(() => {
      return storage.read(archiveId)
    })
    .then((res) => {
      upstreamArchive = res
      return buffer.load()
    })
    .then(() => {
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
    })
    .then(() => {
      // convert raw archive into sessions (=ingestion)
      let sessions = this._ingest(upstreamArchive)
      // contract: there must be a manifest
      if (!sessions['manifest']) {
        throw new Error('There must be a manifest session.')
      }
      // apply pending changes
      if (!buffer.hasPendingChanges()) {
        // TODO: when we have a persisted buffer we need to apply all pending
        // changes.
        // For now, we always start with a fresh buffer
      } else {
        buffer.reset(upstreamArchive.version)
      }
      // register for any changes in each session
      this._registerForAllChanges(sessions)

      this._archiveId = archiveId
      this._upstreamArchive = upstreamArchive
      this._sessions = sessions

      // Run through a repair step (e.g. remove missing files from archive)
      this._repair()
      return this
    })
  }

  _repair() {
    // no-op
  }

  save() {
    if (!this.buffer.hasPendingChanges()) {
      console.info('Save: no pending changes.')
      return Promise.resolve()
    }
    return this._save(this._archiveId)
  }

  /*
    Save as is implemented as follows.

    1. clone: copy all files from original archive to new archive (backend)
    2. save: perform a regular save using user buffer (over new archive, including pending
       documents and blobs)
  */
  saveAs(newArchiveId) {
    return this.storage.clone(this._archiveId, newArchiveId).then(() => {
      return this._save(newArchiveId)
    })
  }

  getEditorSession(docId) {
    return this._sessions[docId]
  }

  _loadManifest(record) {
    if (!record) {
      throw new Error('manifest.xml is missing')
    }
    return ManifestLoader.load(record.data)
  }

  _registerForAllChanges(sessions) {
    forEach(sessions, (session, docId) => {
      this._registerForSessionChanges(session, docId)
    })
  }

  _registerForSessionChanges(session, docId) {
    session.onUpdate('document', (change) => {
      this.buffer.addChange(docId, change)
      // Apps can subscribe to this (e.g. to show there's pending changes)
      this.emit('archive:changed')
    }, this)
  }

  _unregisterFromSession(session) {
    session.off(this)
  }

  /*
    Create a raw archive for upload from the changed resources.
  */
  _save(archiveId) {
    const buffer = this.buffer
    const storage = this.storage
    const sessions = this._sessions

    let rawArchive = this._exportChanges(sessions, buffer)

    // CHALLENGE: we either need to lock the buffer, so that
    // new changes are interfering with ongoing sync
    // or we need something pretty smart caching changes until the
    // sync has succeeded or failed, e.g. we could use a second buffer in the meantime
    // probably a fast first-level buffer (in-mem) is necessary anyways, even in conjunction with
    // a slower persisted buffer
    return storage.write(archiveId, rawArchive).then(res => {
      // TODO: if successful we should receive the new version as response
      // and then we can reset the buffer
      res = JSON.parse(res)
      // console.log('Saved. New version:', res.version)
      buffer.reset(res.version)

      // After successful save the archiveId may have changed (save as use case)
      this._archiveId = archiveId
    }).catch(err => {
      console.error('Saving failed.', err)
    })
  }

  _exportAssets(sessions, buffer, rawArchive) {
    let manifest = sessions.manifest.getDocument()
    let assetNodes = manifest.getAssetNodes()
    assetNodes.forEach(node => {
      let id = node.attr('id')
      if (!buffer.hasBlob(id)) return
      let path = node.attr('path') || id
      let blobRecord = buffer.getBlob(id)
      rawArchive.resources[path] = {
        id,
        data: blobRecord.blob,
        encoding: 'blob',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })
  }

  /*
    Uses the current state of the buffer to generate a rawArchive object
    containing all changed documents
  */
  _exportChanges(sessions, buffer) {
    let rawArchive = {
      version: buffer.getVersion(),
      diff: buffer.getChanges(),
      resources: {}
    }
    this._exportManifest(sessions, buffer, rawArchive)
    this._exportDocuments(sessions, buffer, rawArchive)
    this._exportAssets(sessions, buffer, rawArchive)
    return rawArchive
  }

}
