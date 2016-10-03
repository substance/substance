import AnnotationCommand from '../../ui/AnnotationCommand'

class EditLinkCommand extends AnnotationCommand {

  canCreate() {
    return false
  }

  canTruncate() {
    return false
  }

  canDelete(annos, sel) { // eslint-disable-line
    return false
  }

  canFuse() {
    return false
  }

  canExpand() {
    return false
  }

  // When there's some overlap with only a single annotation we do an expand
  canEdit(annos, sel) { // eslint-disable-line
    return annos.length === 1
  }

}

export default EditLinkCommand
