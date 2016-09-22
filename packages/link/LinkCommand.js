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

  canDelete(annos, sel) { // eslint-disable-line
    return false
  }

}

export default LinkCommand
