import AnnotationCommand from './AnnotationCommand'

class ContainerAnnotationCommand extends AnnotationCommand {

  isDisabled(sel) {
    // TODO: Container selections should be valid if the annotation type
    // is a container annotation. Currently we only allow property selections.
    if (!sel || sel.isNull() || !sel.isAttached() || sel.isCustomSelection()||
        sel.isNodeSelection()) {
      return true
    } else {
      return false
    }
  }

}

export default ContainerAnnotationCommand
