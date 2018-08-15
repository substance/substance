import DocumentNode from './DocumentNode'
import AnnotationMixin from './AnnotationMixin'

export default class InlineNode extends AnnotationMixin(DocumentNode) {
  static isInlineNode () { return true }
}
