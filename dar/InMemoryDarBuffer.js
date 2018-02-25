export default class InMemoryDarBuffer {

  constructor() {
    this._version = null
    this._changes = []
    this._isDirty = {}
    this._blobs = {}
  }

  getVersion() {
    return this._version
  }

  load(archiveId) { // eslint-disable-line
    return Promise.resolve()
  }

  addChange(docId, change) {
    // HACK: if there are no ops we skip
    if (change.ops.length === 0) return
    // console.log('RECORD CHANGE', docId, change)
    this._isDirty[docId] = true
    this._changes.push({
      docId, change
    })
  }

  hasPendingChanges() {
    return this._changes.length > 0
  }

  getChanges() {
    return this._changes.slice()
  }

  hasResourceChanged(docId) {
    return this._isDirty[docId]
  }

  hasBlob(id) {
    return this._blobs[id]
  }

  addBlob(id, blob) {
    this._blobs[id] = blob
  }

  getBlob(id) {
    return this._blobs[id]
  }

  reset(version) {
    this._version = version
    this._changes = []
    this._blobs = {}
    this._isDirty = {}
  }
}
