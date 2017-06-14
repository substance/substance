import { AnnotationMixin } from '../model'
import XMLDocumentNode from './XMLDocumentNode'

export default
class XMLAnnotationNode extends AnnotationMixin(XMLDocumentNode) {

  /*
    The parent of an Annotation is implicitly given by its path.
  */
  get parentNode() {
    const path = this.start.path
    const doc = this.getDocument()
    return doc.get(path[0])
  }

  isPropertyAnnotation() {
    return true
  }

}

XMLAnnotationNode.prototype._elementType = 'annotation'

// HACK: this is necessary so that DOMImporter registers convertes as annotation converters
XMLAnnotationNode.prototype._isPropertyAnnotation = true

XMLAnnotationNode.type = 'annotation'

XMLAnnotationNode.schema = {
  start: "coordinate",
  end: "coordinate"
}
