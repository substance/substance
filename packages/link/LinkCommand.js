import AnnotationCommand from '../../ui/AnnotationCommand'

class LinkCommand extends AnnotationCommand {

  getAnnotationData() {
    return {
      url: ""
    }
  }

  canFuse() {
    return false
  }

  // When there's some overlap with only a single annotation we do an expand
  canEdit(annos, sel) { // eslint-disable-line
    return annos.length === 1
  }

  canDelete(annos, sel) { // eslint-disable-line
    return false
  }

}

export default LinkCommand
