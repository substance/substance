import DocumentNode from './DocumentNode'
import AnnotationMixin from './AnnotationMixin'

export default class InlineNode extends AnnotationMixin(DocumentNode) {
  getText () {
    const doc = this.getDocument()
    const path = this.getPath()
    const text = doc.get(path, 'strict')
    return text.slice(this.start.offset, this.end.offset)
  }

  mustNotBeSplit () { return true }

  static isInlineNode () { return true }
}
