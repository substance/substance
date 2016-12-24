/*
  Implements Substance ChangeStore API. This is just a dumb store.
  No integrity checks are made, as this is the task of DocumentEngine
*/
class ChangeStore {
  constructor(seed) {
    this._changes = seed || {}
  }

  /*
    Gets changes for a given document

    @param {String} documentId document id
    @param {Number} sinceVersion since which change (optional)
    @param {Number} toVersion up to and including version (optional)
  */
  getChanges(documentId, sinceVersion, toVersion, cb) {
    if (typeof sinceVersion === 'function') {
      cb = sinceVersion
      sinceVersion = 0
    } else if (typeof toVersion === 'function') {
      cb = toVersion
      toVersion = undefined
    }
    if (!(documentId && sinceVersion >= 0 && cb)) {
      throw new Error('Invalid arguments')
    }
    let version = this._getVersion(documentId)
    let changes = this._getChanges(documentId)
    changes = changes.slice(sinceVersion, toVersion)
    cb(null, changes, version)
  }

  /*
    Add a change object to the database
  */
  addChange(documentId, change, cb) {
    if (!documentId || !change) {
      throw new Error('Invalid arguments')
    }
    this._addChange(documentId, change)
    let newVersion = this._getVersion(documentId)
    cb(null, newVersion)
  }

  /*
    Delete changes for a given documentId
  */
  deleteChanges(documentId, cb) {
    var deletedChanges = this._deleteChanges(documentId)
    cb(null, deletedChanges.length)
  }

  /*
    Gets the version number for a document
  */
  getVersion(id, cb) {
    cb(null, this._getVersion(id))
  }

  // Handy synchronous helpers
  // -------------------------

  _deleteChanges(documentId) {
    var changes = this._getChanges(documentId)
    delete this._changes[documentId]
    return changes
  }

  _getVersion(documentId) {
    var changes = this._changes[documentId]
    return changes ? changes.length : 0
  }

  _getChanges(documentId) {
    return this._changes[documentId] || []
  }

  _addChange(documentId, change) {
    if (!this._changes[documentId]) {
      this._changes[documentId] = []
    }
    this._changes[documentId].push(change)
  }
}

export default ChangeStore
