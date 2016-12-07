import Err from '../util/SubstanceError'
import computeSnapshot from './computeSnapshot'

// let converter = new JSONConverter()

/**
  API for creating and retrieving document snapshots
*/
class SnapshotEngine {
  constructor(config) {
    this.changeStore = config.changeStore
    this.documentStore = config.documentStore

    // Optional
    this.snapshotStore = config.snapshotStore
    // Snapshot creation frequency (e.g. if it equals 15 then every
    // 15th version will be saved as snapshot)
    this.frequency = config.frequency || 1
  }

  /*
    Returns a snapshot for a given documentId and version
  */
  getSnapshot(args, cb) {
    if (!args || !args.documentId) {
      return cb(new Err('InvalidArgumentsError', {
        message: 'args requires a documentId'
      }))
    }
    this._computeSnapshot(args, cb)
  }

  /*
    Called by DocumentEngine.addChange.

    Here the implementer decides whether a snapshot should be created or not.
    It may be a good strategy to only create a snaphot for every 10th version.
    However for now we will just snapshot each change to keep things simple.

    TODO: this could potentially live in DocumentEngine
  */
  requestSnapshot(documentId, version, cb) {
    if (this.snapshotStore && version % this.frequency === 0) {
      this.createSnapshot({
        documentId: documentId
      }, cb)
    } else {
      cb(null) // do nothing
    }
  }

  /*
    Creates a snapshot
  */
  createSnapshot(args, cb) {
    if (!this.snapshotStore) {
      throw new Err('SnapshotStoreRequiredError', {
        message: 'You must provide a snapshot store to be able to create snapshots'
      })
    }
    this._computeSnapshot(args, function(err, snapshot) {
      if (err) return cb(err)
      this.snapshotStore.saveSnapshot(snapshot, cb)
    }.bind(this))
  }

  /*
    Compute a snapshot based on the documentId and version (optional)

    If no version is provided a snaphot for the latest version is created.
  */
  _computeSnapshot(args, cb) {
    this.documentStore.getDocument(args.documentId, (err, docRecord) => {
      if (err) return cb(err)

      if (args.version === undefined) {
        args.version = docRecord.version // set version to the latest version
      }

      // We add the docRecord to the args object
      args.docRecord = docRecord

      if (this.snapshotStore && args.version !== 0) {
        this._computeSnapshotSmart(args, cb)
      } else {
        this._computeSnapshotDumb(args, cb)
      }
    })
  }

  /*
    Used when a snapshot store is present. This gives gives a huge performance
    benefit.

    Example: Let's assume we want to request a snapshot for a new version 20.
    Now getLatestSnapshot will give us version 15. This requires us to fetch
    the changes since version 16 and apply those, plus the very new change.
  */
  _computeSnapshotSmart(args, cb) {
    let documentId = args.documentId
    let version = args.version
    let jsonDoc = { nodes: {}}

    // snaphot = null if no snapshot has been found
    this.snapshotStore.getSnapshot({
      documentId: documentId,
      version: version,
      findClosest: true
    }, (err, snapshot) => {
      if (err) return cb(err)

      if (snapshot && version === snapshot.version) {
        // we alread have a snapshot for this version
        return cb(null, snapshot)
      }

      let knownVersion
      if (snapshot) {
        knownVersion = snapshot.version
      } else {
        knownVersion = 0 // we need to fetch all changes
      }
      if (snapshot) {
        jsonDoc = snapshot.data
      }

      // Now we get the remaining changes after the known version
      this.changeStore.getChanges({
        documentId: documentId,
        sinceVersion: knownVersion,
        toVersion: version
      }, (err, result) => {
        if (err) return cb(err)
        let ops = _extractOps(result.changes)
        jsonDoc = computeSnapshot(jsonDoc, ops)
        let snapshot = {
          documentId: documentId,
          version: version,
          data: jsonDoc
        }
        cb(null, snapshot)
      })
    })
  }

  /*
    Compute a snapshot in a dumb way by applying the full change history
  */
  _computeSnapshotDumb(args, cb) {
    let documentId = args.documentId
    let version = args.version
    let jsonDoc = { nodes: {}}

    // Get all changes for a document
    this.changeStore.getChanges({
      documentId: documentId,
      sinceVersion: 0
    }, (err, result) => {
      if (err) return cb(err)
      let ops = _extractOps(result.changes)
      jsonDoc = computeSnapshot(jsonDoc, ops)
      let snapshot = {
        documentId: documentId,
        version: version,
        data: jsonDoc
      }
      cb(null, snapshot)
    })
  }
}

function _extractOps(changes) {
  let ops = []
  changes.forEach((change) => {
    ops.concat(change.ops)
  })
  return ops
}


export default SnapshotEngine
