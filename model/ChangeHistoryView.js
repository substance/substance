import last from '../util/last'

export default class ChangeHistoryView {
  constructor (documentSession) {
    this.documentSession = documentSession
    this.done = []
    this.undone = []
  }

  canUndo () {
    return this.done.length > 0
  }

  canRedo () {
    return this.undone.length > 0
  }

  commit (change, info) {
    let idx = this.documentSession._history.length
    this.documentSession._commitChange(change, info)
    this.done.push(idx)
    // whenever a change is committed via this view
    // then undone is cleared, i.e. these changes can not be redone
    this.undone.length = 0
  }

  undo () {
    // take the last index of done
    let idx = last(this.done)
    this.undone.unshift(this.done.pop())
    try {
      this.documentSession.revert(idx)
    } catch (err) {
      this.done.push(this.undone.shift())
    }
  }

  redo () {
    // take the last index of done
    let idx = last(this.undone)
    this.done.push(this.undone.shift())
    try {
      this.documentSession.reapply(idx)
    } catch (err) {
      this.undone.unshift(this.done.pop())
    }
  }

  reset () {
    this.done.length = 0
    this.undone.length = 0
  }
}
