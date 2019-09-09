import { last } from '../util'

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

  getChanges () {
    return this._done.slice()
  }

  addChange (change) {
    this._done.push(change)
    // undone changes are cleared whenever a new change is recorded
    if (this._undone.length > 0) {
      this._undone.length = 0
    }
  }

  undo () {
    let change = last(this._done)
    if (change) {
      let inverted = this._editorSession.getDocument().invert(change)
      this._editorSession.applyChange(inverted, { replay: true })
      this._done.pop()
      this._undone.push(change)
      return inverted
    }
  }

  redo () {
    let change = last(this._undone)
    if (change) {
      this._editorSession.applyChange(change, { replay: true })
      this._undone.pop()
      this._done.push(change)
      return change
    }
  }
}
