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

}

XMLAnnotationNode.prototype._elementType = 'annotation'

XMLAnnotationNode.type = 'annotation'

XMLAnnotationNode.schema = {
  start: "coordinate",
  end: "coordinate"
}
