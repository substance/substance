import forEach from '../util/forEach'
import DocumentNode from './DocumentNode'
import AnnotationMixin from './AnnotationMixin'

/*
  Describes an annotation sticking on a container that can span over multiple
  nodes.

  @class

  @example

  ```js
  {
    "id": "subject_reference_1",
    "type": "subject_reference",
    "containerId": "content",
    "start": {
      "path": ["text_2", "content"],
      "offset": 100,
    },
    "end": {
      "path": ["text_4", "content"],
      "offset": 40
    }
  }
  ```
 */

class ContainerAnnotation extends AnnotationMixin(DocumentNode) {

  setHighlighted(highlighted, scope) {
    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted
      this.highlightedScope = scope
      this.emit('highlighted', highlighted, scope)
      forEach(this.fragments, function(frag) {
        frag.emit('highlighted', highlighted, scope)
      })
    }
  }

}

ContainerAnnotation.schema = {
  type: "container-annotation",
  containerId: "string",
  start: "coordinate",
  end: "coordinate"
}

ContainerAnnotation.prototype._isAnnotation = true
ContainerAnnotation.prototype._isContainerAnnotation = true

export default ContainerAnnotation
