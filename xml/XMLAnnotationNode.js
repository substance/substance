import { PropertyAnnotation } from '../model'

export default
class AnnotationNode extends PropertyAnnotation {

  get parent() {
    const path = this.path
    const doc = this.getDocument()
    return doc.get(path[0])
  }

}

AnnotationNode.prototype._elementType = 'annotation'

AnnotationNode.type = 'annotation'


AnnotationNode.schema = {
  attributes: { type: 'object', default: {} }
}
