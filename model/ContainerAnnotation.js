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
    "containerPath": ["body", "content"],
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

export default class ContainerAnnotation extends AnnotationMixin(DocumentNode) {
  setHighlighted (highlighted, scope) {
    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted
      this.highlightedScope = scope
      this.emit('highlighted', highlighted, scope)
      forEach(this.fragments, function (frag) {
        frag.emit('highlighted', highlighted, scope)
      })
    }
  }

  static isAnnotation () { return true }

  static isContainerAnnotation () { return true }
}

ContainerAnnotation.schema = {
  type: '@container-annotation',
  containerPath: { type: ['array', 'id'] },
  start: 'coordinate',
  end: 'coordinate'
}
