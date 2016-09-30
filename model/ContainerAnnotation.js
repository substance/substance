import isEqual from 'lodash/isEqual'
import last from 'lodash/last'
import each from 'lodash/each'
import EventEmitter from '../util/EventEmitter'
import DocumentNode from './DocumentNode'
import Selection from './Selection'
import Anchor from './Anchor'
import documentHelpers from './documentHelpers'

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
    "startPath": ["text_2", "content"],
    "startOffset": 100,
    "endPath": ["text_4", "content"],
    "endOffset": 40
  }
  ```
 */

class ContainerAnnotation extends DocumentNode {

  get _isAnnotation() { return true }

  get _isContainerAnnotation() { return true }

  /**
    Get the plain text spanned by this annotation.

    @return {String}
  */
  getText() {
    var doc = this.getDocument()
    if (!doc) {
      console.warn('Trying to use a ContainerAnnotation which is not attached to the document.')
      return ""
    }
    return documentHelpers.getTextForSelection(doc, this.getSelection())
  }

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
      startPath: this.startPath,
      startOffset: this.startOffset,
      endPath: this.endPath,
      endOffset: this.endOffset
    })
  }

  setHighlighted(highlighted, scope) {
    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted
      this.highlightedScope = scope
      this.emit('highlighted', highlighted, scope)

      each(this.fragments, function(frag) {
        frag.emit('highlighted', highlighted, scope)
      })
    }
  }

  updateRange(tx, sel) {
    if (!sel.isContainerSelection()) {
      throw new Error('Cannot change to ContainerAnnotation.')
    }
    if (!isEqual(this.startPath, sel.start.path)) {
      tx.set([this.id, 'startPath'], sel.start.path)
    }
    if (this.startOffset !== sel.start.offset) {
      tx.set([this.id, 'startOffset'], sel.start.offset)
    }
    if (!isEqual(this.endPath, sel.end.path)) {
      tx.set([this.id, 'endPath'], sel.end.path)
    }
    if (this.endOffset !== sel.end.offset) {
      tx.set([this.id, 'endOffset'], sel.end.offset)
    }
  }

  getFragments() {
    var fragments = []
    var doc = this.getDocument()
    var container = doc.get(this.containerId)
    var paths = container.getPathRange(this.startPath, this.endPath)
    if (paths.length === 1) {
      fragments.push(new ContainerAnnotationFragment(this, paths[0], "property"))
    } else if (paths.length > 1) {
      fragments.push(new ContainerAnnotationFragment(this, paths[0], "start"))
      fragments.push(new ContainerAnnotationFragment(this, last(paths), "end"))
      for (var i = 1; i < paths.length-1; i++) {
        fragments.push(new ContainerAnnotationFragment(this, paths[i], "inner"))
      }
    }
    return fragments
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
}

ContainerAnnotation.define({
  type: "container-annotation",
  containerId: "string",
  startPath: ["string"],
  startOffset: "number",
  endPath: ["string"],
  endOffset: "number"
})

ContainerAnnotation.isContainerAnnotation = true

/**
  @class
  @private
*/
class ContainerAnnotationAnchor extends Anchor {

  constructor(anno, isStart) {
    super('SKIP')
    // Note: we are not calling Anchor() as it is not useful for us
    // as we need to delegate to the annos value dynamically
    // Anchor.call(this, path, offset)
    EventEmitter.call(this)

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

}

EventEmitter.mixin(ContainerAnnotationAnchor)

Object.defineProperties(ContainerAnnotationAnchor.prototype, {
  path: {
    get: function() { return this.getPath(); }
  },
  offset: {
    get: function() { return this.getOffset(); }
  }
})

/**
  @class
  @private
*/
class ContainerAnnotationFragment extends EventEmitter {

  constructor(anno, path, mode) {
    super()

    this.type = "container-annotation-fragment"
    this.anno = anno
    // HACK: id is necessary for Fragmenter
    this.id = anno.id
    this.path = path
    this.mode = mode
  }

  getTypeNames() {
    return [this.type]
  }

  getStartOffset() {
    return ( (this.mode === "start" || this.mode === "property") ? this.anno.startOffset : 0)
  }

  getEndOffset() {
    var doc = this.anno.getDocument()
    var textProp = doc.get(this.path)
    var length = textProp.length
    return ( (this.mode === "end" || this.mode === "property") ? this.anno.endOffset : length)
  }
}

ContainerAnnotationFragment.fragmentation = Number.MAX_VALUE

Object.defineProperties(ContainerAnnotationFragment.prototype, {
  startOffset: {
    get: function() { return this.getStartOffset(); },
    set: function() { throw new Error('ContainerAnnotationFragment.startOffset is read-only.'); }
  },
  endOffset: {
    get: function() { return this.getEndOffset(); },
    set: function() { throw new Error('ContainerAnnotationFragment.endOffset is read-only.'); }
  },
  highlighted: {
    get: function() {
      return this.anno.highlighted
    },
    set: function() { throw new Error('ContainerAnnotationFragment.highlighted is read-only.'); }
  }
})

ContainerAnnotation.Anchor = ContainerAnnotationAnchor
ContainerAnnotation.Fragment = ContainerAnnotationFragment

export default ContainerAnnotation
