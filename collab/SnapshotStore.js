/*
  Implements Substance SnapshotStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of SnapshotEngine
*/
class SnapshotStore {
  constructor(seed) {
    this._snapshots = seed || {}
  }

  /*
    Get all available versions for a document
  */
  getVersions(documentId, cb) {
    let versions = this._getVersions(documentId)
    cb(null, versions)
  }

  /*
    Get Snapshot by documentId and version.

    Returns snapshot data and snaphot version
  */
  getSnapshot(documentId, version, cb) {
    if (!arguments.length === 3) {
      throw new Error('Invalid Arguments')
    }
    let docEntry = this._snapshots[documentId]
    if (!docEntry) return cb(null, undefined)
    let snapshot = docEntry[version]
    if (snapshot) {
      cb(null, snapshot, version)
    } else {
      cb(null, undefined)
    }
  }

  /*
    Saves a snapshot for a given documentId and version.

    Please note that an existing snapshot will be overwritten.
  */
  saveSnapshot(documentId, version, data, cb) {
    if (!documentId || !version || !data) {
      throw new Error('Invalid arguments')
    }
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
  deleteSnapshot(documentId, version, cb) {
    let docEntry = this._snapshots[documentId]
    if (!docEntry || !docEntry[version]) {
      return cb(new Error('Snapshot does not exist and can not be deleted'))
    }
    let snapshot = this._snapshots[documentId][version]
    delete this._snapshots[documentId][version]
    cb(null, snapshot)
  }

  /*
    Get versions for a given document
  */
  _getVersions(documentId) {
    let docEntry = this._snapshots[documentId]
    if (!docEntry) return [] // no versions available
    return Object.keys(docEntry)
  }

}

export default SnapshotStore
