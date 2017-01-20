class ChangeHistory {

  constructor() {
    // undo list
    this.doneChanges = []
    // redo list
    this.undoneChanges = []
    // last change for accumlation
    this.lastChange = null
  }

  canUndo() {
    return this.doneChanges.length > 0
  }

  canRedo() {
    return this.undoneChanges.length > 0
  }

  push(change) {
    this.doneChanges.push(change)
    this.undoneChanges = []
  }

}

export default ChangeHistory
