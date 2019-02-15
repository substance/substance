import EventEmitter from '../util/EventEmitter'
import DocumentChange from './DocumentChange'

export default class DocumentSession extends EventEmitter {
  constructor (doc) {
    super()

    this._document = doc
    this._history = []
  }

  getDocument () {
    return this._document
  }

  // EXPERIMENTAL: for certain cases it is useful to store volatile information on nodes
  // Then the data does not need to be disposed when a node is deleted.
  updateNodeStates (tuples, options = {}) {
    // using a pseudo change to get into the existing updating mechanism
    const doc = this._document
    let change = new DocumentChange([], {}, {})
    let info = { action: 'node-state-update' }
    change._extractInformation()
    change.info = info
    for (let [id, state] of tuples) {
      let node = doc.get(id)
      if (!node) continue
      if (!node.state) node.state = {}
      Object.assign(node.state, state)
      change.updated[id] = true
    }
    if (!options.silent) {
      doc._notifyChangeListeners(change, info)
      this.emit('change', change, info)
    }
  }

  revert (changeIdx) {
    let change = this._history[changeIdx]
    if (!change) throw new Error('Illegal change index')
    const doc = this.getDocument()
    change = doc.invert(change)
    change = doc.rebase(change, this._history.slice(changeIdx + 1))
    this._applyChange(change, { replay: 'true' })
    this._history.push(change)
    return change
  }

  _commitChange (change, info) {
    change.timestamp = Date.now()
    this._applyChange(change, info)
    this._history.push(change)
  }

  _applyChange (change, info) {
    if (!change) throw new Error('Invalid change')
    const doc = this.getDocument()
    doc._apply(change)
    doc._notifyChangeListeners(change, info)
    this.emit('change', change, info)
  }
}
