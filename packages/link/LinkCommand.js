import AnnotationCommand from '../../ui/AnnotationCommand'

class LinkCommand extends AnnotationCommand {

  canFuse() { return false }

  canDelete() { return false }
}

export default LinkCommand
