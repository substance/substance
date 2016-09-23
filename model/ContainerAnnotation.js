import isEqual from 'lodash/isEqual'
import last from 'lodash/last'
import each from 'lodash/each'
import EventEmitter from '../util/EventEmitter'
import DocumentNode from './DocumentNode'
import Selection from './Selection'
import Anchor from './Anchor'
import documentHelpers from './documentHelpers'

/**
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

  get _isAnnotation() {
    return true
  }

  get _isContainerAnnotation() {
    return true
  }

  /**
    Get the plain text spanned by this annotation.

    @return {String}
  */
  getText() {
    let doc = this.getDocument()
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
    let doc = this.getDocument()
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
    let fragments = []
    let doc = this.getDocument()
    let container = doc.get(this.containerId)
    let paths = container.getPathRange(this.startPath, this.endPath)
    if (paths.length === 1) {
      fragments.push(new ContainerAnnotation.Fragment(this, paths[0], "property"))
    } else if (paths.length > 1) {
      fragments.push(new ContainerAnnotation.Fragment(this, paths[0], "start"))
      fragments.push(new ContainerAnnotation.Fragment(this, last(paths), "end"))
      for (let i = 1; i < paths.length-1; i++) {
        fragments.push(new ContainerAnnotation.Fragment(this, paths[i], "inner"))
      }
    }
    return fragments
  }

  getStartAnchor() {
    if (!this._startAnchor) {
      this._startAnchor = new ContainerAnnotation.Anchor(this, 'isStart')
    }
    return this._startAnchor
  }

  getEndAnchor() {
    if (!this._endAnchor) {
      this._endAnchor = new ContainerAnnotation.Anchor(this)
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
ContainerAnnotation.Anchor = function(anno, isStart) {
  // Note: we are not calling Anchor() as it is not useful for us
  // as we need to delegate to the annos value dynamically
  // Anchor.call(this, path, offset)

  // initializing mixin
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

ContainerAnnotation.Anchor.Prototype = function() {

  this.getTypeNames = function() {
    return [this.type];
  };

  this.getPath = function() {
    return (this.isStart ? this.node.startPath : this.node.endPath);
  };

  this.getOffset = function() {
    return (this.isStart ? this.node.startOffset : this.node.endOffset);
  };

};

Anchor.extend(ContainerAnnotation.Anchor, EventEmitter.prototype);

Object.defineProperties(ContainerAnnotation.Anchor.prototype, {
  path: {
    get: function() { return this.getPath(); }
  },
  offset: {
    get: function() { return this.getOffset(); }
  }
});

/**
  @class
  @private
*/
ContainerAnnotation.Fragment = function(anno, path, mode) {
  EventEmitter.call(this);

  this.type = "container-annotation-fragment";
  this.anno = anno;
  // HACK: id is necessary for Fragmenter
  this.id = anno.id;
  this.path = path;
  this.mode = mode;
};

ContainerAnnotation.Fragment.Prototype = function() {
  this.getTypeNames = function() {
    return [this.type];
  };

  this.getStartOffset = function() {
    return ( (this.mode === "start" || this.mode === "property") ? this.anno.startOffset : 0);
  };

  this.getEndOffset = function() {
    var doc = this.anno.getDocument();
    var textProp = doc.get(this.path);
    var length = textProp.length;
    return ( (this.mode === "end" || this.mode === "property") ? this.anno.endOffset : length);
  };
};

EventEmitter.extend(ContainerAnnotation.Fragment);

ContainerAnnotation.Fragment.fragmentation = Number.MAX_VALUE;

Object.defineProperties(ContainerAnnotation.Fragment.prototype, {
  startOffset: {
    get: function() { return this.getStartOffset(); },
    set: function() { throw new Error('ContainerAnnotation.Fragment.startOffset is read-only.'); }
  },
  endOffset: {
    get: function() { return this.getEndOffset(); },
    set: function() { throw new Error('ContainerAnnotation.Fragment.endOffset is read-only.'); }
  },
  highlighted: {
    get: function() {
      return this.anno.highlighted;
    },
    set: function() { throw new Error('ContainerAnnotation.Fragment.highlighted is read-only.'); }
  }
});

export default ContainerAnnotation;
