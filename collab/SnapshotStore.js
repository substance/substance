import Err from '../util/SubstanceError'

/*
  Implements Substance SnapshotStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of SnapshotEngine
*/
class SnapshotStore {
  constructor(config) {
    this.config = config

    // Snapshots will stored here
    this._snapshots = {}
  }

  /*
    Get Snapshot by documentId and version. If no version is provided
    the highest version available is returned

    @return {Object} snapshot record
  */
  getSnapshot(args, cb) {
    if (!args || !args.documentId) {
      return cb(new Err('InvalidArgumentsError', {
        message: 'args require a documentId'
      }))
    }
    let documentId = args.documentId
    let version = args.version
    let docEntry = this._snapshots[documentId]
    let snapshotData
    let result

    if (!docEntry) return cb(null, undefined)
    let availableVersions = Object.keys(docEntry)

    // Exit if no versions are available
    if (availableVersions.length === 0) return cb(null, undefined)

    // If no version is given we return the latest version available
    if (!version) {
      let latestVersion = Math.max.apply(null, availableVersions)
      snapshotData = docEntry[latestVersion]
      result = {
        data: snapshotData,
        version: latestVersion
      }
    } else {
      // Attemt to get the version
      snapshotData = docEntry[version]

      if (!snapshotData && args.findClosest) {
        // We don't have a snaphot for that requested version
        let smallerVersions = availableVersions.filter(function(v) {
          return parseInt(v, 10) < version
        })
        // Take the closest version if there is any
        let clostestVersion = Math.max.apply(null, smallerVersions)
        snapshotData = docEntry[clostestVersion]
        result = {
          data: snapshotData,
          version: clostestVersion
        }
      } else if (snapshotData) {
        result = {
          data: snapshotData,
          version: version
        }
      }
    }
    cb(null, result)
  }

  /*
    Stores a snapshot for a given documentId and version.

    Please not that an existing snapshot will be overwritten.
  */
  saveSnapshot(args, cb) {
    let documentId = args.documentId
    let version = args.version
    let data = args.data
    let docEntry = this._snapshots[documentId]
    if (!docEntry) {
      docEntry = this._snapshots[documentId] = {}
    }
    docEntry[version] = data
    cb(null, docEntry[version])
  }

  /*
    Removes a snapshot for a given documentId + version
  */
  deleteSnaphot(documentId, version, cb) {
    let docEntry = this._snapshots[documentId]
    if (!docEntry || !docEntry[version]) {
      return cb(new Err('DeleteError', {
        message: 'Snapshot could not be found'
      }))
    }
    let snapshot = this._snapshots[documentId][version]
    delete this._snapshots[documentId][version]
    cb(null, snapshot)
  }

  /*
    Deletes all snapshots for a given documentId
  */
  deleteSnapshotsForDocument(documentId, cb) {
    let docEntry = this._snapshots[documentId]
    let deleteCount = 0
    if (docEntry) deleteCount = Object.keys(docEntry).length
    delete this._snapshots[documentId]
    cb(null, deleteCount)
  }

  /*
    Returns true if a snapshot exists for a certain version
  */
  snapshotExists(documentId, version, cb) {
    let exists = false
    let docRecord = this._snapshots[documentId]

    if (docRecord) {
      exists = docRecord[version]
    }
    cb(null, exists)
  }

  /*
    Seeds the database
  */
  seed(snapshots, cb) {
    this._snapshots = snapshots
    if (cb) { cb(null) }
    return this
  }

}

export default SnapshotStore
