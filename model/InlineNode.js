import DocumentNode from './DocumentNode'
import AnnotationMixin from './AnnotationMixin'

export default class InlineNode extends AnnotationMixin(DocumentNode) {
  mustNotBeSplit () { return true }
  static isInlineNode () { return true }
}
