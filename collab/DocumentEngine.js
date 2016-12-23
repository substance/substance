import EventEmitter from '../util/EventEmitter'
import SnapshotEngine from './SnapshotEngine'

/*
  DocumentEngine
*/
class DocumentEngine extends EventEmitter {
  constructor(config) {
    super()
    this.changeStore = config.changeStore
    this.snapshotStore = config.snapshotStore
    // Snapshot creation frequency (e.g. if it equals 15 then every
    // 15th version will be saved as snapshot)
    this.snapshotFrequency = config.snapshotFrequency || 1
    this.snapshotEngine = new SnapshotEngine({
      changeStore: this.changeStore,
      snapshotStore: this.snapshotStore
    })
  }

  /*
    Creates a new document

    A valid document must have at least one valid change
  */
  createDocument(documentId, initialChange, cb) {
    this.addChange(documentId, initialChange, cb)
  }

  /*
    Get a document snapshot for a given version. If no version
    is provivded, the latest version is returned
  */
  getDocument(documentId, version, cb) {
    if (typeof version === 'function') {
      cb = version
      version = undefined
    }
    if (!documentId) {
      throw new Error('Invalid Arguments')
    }
    if (version === undefined) {
      this.getVersion(documentId, (err, version) => {
        if (err) return cb(err)
        this.snapshotEngine.getSnapshot(documentId, version, cb)
      })
    } else {
      this.snapshotEngine.getSnapshot(documentId, version, cb)
    }
  }

  /*
    Delete document by documentId
  */
  deleteDocument(documentId, cb) {
    this.changeStore.deleteChanges(documentId, (err) => {
      if (err) {
        return cb(new Error('Deleting changes failed'))
      }
    })
  }

  /*
    Check if a given document exists
  */
  documentExists(documentId, cb) {
    this.getVersion(documentId, (err, version) => {
      if (version >= 0) {
        cb(null, true)
      } else {
        cb(null, false)
      }
    })
  }

  /*
    Get changes based on documentId, sinceVersion
  */
  getChanges(documentId, sinceVersion, toVersion, cb) {
    this.changeStore.getChanges(documentId, sinceVersion, toVersion, cb)
  }

  /*
    Get version for given documentId
  */
  getVersion(documentId, cb) {
    this.changeStore.getVersion(documentId, cb)
  }

  /*
    Here the implementer decides whether a snapshot should be created or not.
    It may be a good strategy to only create a snaphot for every 10th version.
    However for now we will just snapshot each change to keep things simple.
  */
  requestSnapshot(documentId, version, cb) {
    if (version % this.snapshotFrequency === 0) {
      this.snapshotEngine.createSnapshot(documentId, version, cb)
    } else {
      cb(null) // do nothing
    }
  }

  /*
    Add change to a given documentId.

    Snapshot creation is requested on each change to be stored.
  */
  addChange(documentId, change, cb) {
    this.changeStore.addChange(documentId, change, (err, newVersion) => {
      if (err) return cb(err)

      this.requestSnapshot(documentId, newVersion, () => {
        // no matter if snaphot creation errored or not we will confirm change
        cb(null, newVersion)
      })
    })
  }
}

export default DocumentEngine
