import oo from '../util/oo'

class DragAndDropHandler {

  get _isDragAndDropHandler() {
    return true 
  }

  dragStart(params, context) { // eslint-disable-line
    // nothing
  }

  drop(params, context) { // eslint-disable-line
    // nothing
  }

  dragEnd(params, context) { // eslint-disable-line
    // nothing
  }

}

oo.initClass(DragAndDropHandler)

export default DragAndDropHandler
