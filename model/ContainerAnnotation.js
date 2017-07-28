import { isEqual, forEach } from '../util'
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

  constructor(doc, props) {
    super(doc, props)

    // HACK: leaving custom information so that we can better understand the role of the coordinate within the annotation
    this.start._isStart = true
    this.start._annotationId = this.id
    this.end._isEnd = true
    this.end._annotationId = this.id
  }

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

  _updateRange(tx, sel) {
    if (!sel.isContainerSelection()) {
      throw new Error('Invalid argument.')
    }
    // TODO: use coordinate ops
    if (!isEqual(this.start.path, sel.start.path)) {
      tx.set([this.id, 'start', 'path'], sel.start.path)
    }
    if (this.start.offset !== sel.start.offset) {
      tx.set([this.id, 'start', 'offset'], sel.start.offset)
    }
    if (!isEqual(this.end.path, sel.end.path)) {
      tx.set([this.id, 'end', 'path'], sel.end.path)
    }
    if (this.end.offset !== sel.end.offset) {
      tx.set([this.id, 'end', 'offset'], sel.end.offset)
    }
  }
}

ContainerAnnotation.schema = {
  type: "container-annotation",
  containerId: "string"
}

ContainerAnnotation.prototype._isContainerAnnotation = true

export default ContainerAnnotation
