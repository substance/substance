class DragAndDropHandler {

  match(dragState, context) { // eslint-disable-line
    return false
  }

  drop(dragState, context) { // eslint-disable-line
    // nothing
  }

  get _isDragAndDropHandler() {
    return true
  }

}

export default DragAndDropHandler
