import last from '../util/last'

export default class SimpleChangeHistory {
  constructor (editorSession) {
    this._editorSession = editorSession
    this._done = []
    this._undone = []
  }

  canUndo () {
    return this._done.length > 0
  }

  canRedo () {
    return this._undone.length > 0
  }

  commit (change) {
    this._done.push(change)
    // undone changes are cleared whenever a new change is recorded
    if (this._undone.length > 0) {
      this._undone.length = 0
    }
  }

  undo () {
    let change = last(this._done)
    if (change) {
      let inverted = change.invert()
      this._editorSession._applyChange(inverted, { replay: true })
      this._done.pop()
      this._undone.push(change)
    }
  }

  redo () {
    let change = last(this._undone)
    if (change) {
      this._editorSession._applyChange(change, { replay: true })
      this._undone.pop()
      this._done.push(change)
    }
  }
}
