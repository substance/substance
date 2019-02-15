export default class ChangeHistoryView {
  constructor (documentSession) {
    this.documentSession = documentSession
    this._undo = []
    this._redo = []
  }

  canUndo () {
    return this._undo.length > 0
  }

  canRedo () {
    return this._redo.length > 0
  }

  commit (change, info) {
    let idx = this.documentSession._history.length
    this.documentSession._commitChange(change, info)
    this._undo.push(idx)
    // whenever a change is committed via this view
    // then undone is cleared, i.e. these changes can not be redone
    this._redo.length = 0
  }

  undo () {
    if (this._undo.length === 0) return
    const history = this.documentSession._history
    let newIdx = history.length
    // take the last index of done
    let idx = this._undo.pop()
    let change
    try {
      change = this.documentSession.revert(idx)
      this._redo.push(newIdx)
    } catch (err) {
      this._undo.push(idx)
    }
    return change
  }

  redo () {
    if (this._redo.length === 0) return
    const history = this.documentSession._history
    let newIdx = history.length
    // take the last index of done
    let idx = this._redo.pop()
    let change
    try {
      change = this.documentSession.revert(idx)
      this._undo.push(newIdx)
    } catch (err) {
      this._redo.push(idx)
    }
    return change
  }

  reset () {
    this._undo.length = 0
    this._redo.length = 0
  }
}
