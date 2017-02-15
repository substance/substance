import isEqual from '../util/isEqual'
import forEach from '../util/forEach'
import Annotation from './Annotation'
import Selection from './Selection'
import Anchor from './Anchor'

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

class ContainerAnnotation extends Annotation {

  /**
    Provides a selection which has the same range as this annotation.

    @return {model/ContainerSelection}
  */
  getSelection() {
    var doc = this.getDocument()
    // Guard: when this is called while this node has been detached already.
    if (!doc) {
      console.warn('Trying to use a ContainerAnnotation which is not attached to the document.')
      return Selection.nullSelection()
    }
    return doc.createSelection({
      type: "container",
      containerId: this.containerId,
      startPath: this.start.path,
      startOffset: this.start.offset,
      endPath: this.end.path,
      endOffset: this.end.offset
    })
  }

  getStartAnchor() {
    if (!this._startAnchor) {
      this._startAnchor = new ContainerAnnotationAnchor(this, 'isStart')
    }
    return this._startAnchor
  }

  getEndAnchor() {
    if (!this._endAnchor) {
      this._endAnchor = new ContainerAnnotationAnchor(this)
    }
    return this._endAnchor
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

/**
  @internal
*/
class ContainerAnnotationAnchor extends Anchor {

  constructor(anno, isStart) {
    super('SKIP')
    // Note: we are not calling Anchor() as it is not useful for us
    // as we need to delegate to the annos value dynamically
    // Anchor.call(this, path, offset)

    this.type = "container-annotation-anchor"
    this.anno = anno
    // TODO: remove this.node in favor of this.anno
    this.node = anno
    this.id = anno.id
    this.containerId = anno.containerId
    this.isStart = Boolean(isStart)
    Object.freeze(this)
  }


  getTypeNames() {
    return [this.type]
  }

  getPath() {
    return (this.isStart ? this.node.startPath : this.node.endPath)
  }

  getOffset() {
    return (this.isStart ? this.node.startOffset : this.node.endOffset)
  }

  get path() {
    return this.getPath()
  }

  get offset() {
    return this.getOffset()
  }
}

ContainerAnnotation.schema = {
  type: "container-annotation",
  containerId: "string"
}

ContainerAnnotation.prototype._isContainerAnnotation = true

ContainerAnnotation.Anchor = ContainerAnnotationAnchor

export default ContainerAnnotation
