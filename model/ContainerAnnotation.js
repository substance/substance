'use strict';

var isEqual = require('lodash/isEqual');
var last = require('lodash/last');
var each = require('lodash/each');
var EventEmitter = require('../util/EventEmitter');
var DocumentNode = require('./DocumentNode');
var Selection = require('./Selection');
var Anchor = require('./Anchor');
var documentHelpers = require('./documentHelpers');

/**
  Describes an annotation sticking on a container that can span over multiple
  nodes.

  @class

  @example

  ```js
  {
    "id": "subject_reference_1",
    "type": "subject_reference",
    "container": "content",
    "startPath": ["text_2", "content"],
    "startOffset": 100,
    "endPath": ["text_4", "content"],
    "endOffset": 40
  }
  ```
 */

function ContainerAnnotation() {
  ContainerAnnotation.super.apply(this, arguments);
}

ContainerAnnotation.Prototype = function() {

  /**
    Get the plain text spanned by this annotation.

    @return {String}
  */
  this.getText = function() {
    var doc = this.getDocument();
    if (!doc) {
      console.warn('Trying to use a ContainerAnnotation which is not attached to the document.');
      return "";
    }
    return documentHelpers.getTextForSelection(doc, this.getSelection());
  };

  /**
    Provides a selection which has the same range as this annotation.

    @return {model/ContainerSelection}
  */
  this.getSelection = function() {
    var doc = this.getDocument();
    // Guard: when this is called while this node has been detached already.
    if (!doc) {
      console.warn('Trying to use a ContainerAnnotation which is not attached to the document.');
      return Selection.nullSelection();
    }
    return doc.createSelection({
      type: "container",
      containerId: this.container,
      startPath: this.startPath,
      startOffset: this.startOffset,
      endPath: this.endPath,
      endOffset: this.endOffset
    });
  };

  this.setHighlighted = function(highlighted, scope) {
    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted;
      this.highlightedScope = scope;
      this.emit('highlighted', highlighted, scope);

      each(this.fragments, function(frag) {
        frag.emit('highlighted', highlighted, scope);
      });
    }
  };

  this.updateRange = function(tx, sel) {
    if (!sel.isContainerSelection()) {
      throw new Error('Cannot change to ContainerAnnotation.');
    }
    if (!isEqual(this.startPath, sel.start.path)) {
      tx.set([this.id, 'startPath'], sel.start.path);
    }
    if (this.startOffset !== sel.start.offset) {
      tx.set([this.id, 'startOffset'], sel.start.offset);
    }
    if (!isEqual(this.endPath, sel.end.path)) {
      tx.set([this.id, 'endPath'], sel.end.path);
    }
    if (this.endOffset !== sel.end.offset) {
      tx.set([this.id, 'endOffset'], sel.end.offset);
    }
  };

  this.getFragments = function() {
    var fragments = [];
    var doc = this.getDocument();
    var container = doc.get(this.container);
    var paths = container.getPathRange(this.startPath, this.endPath);
    if (paths.length === 1) {
      fragments.push(new ContainerAnnotation.Fragment(this, paths[0], "property"));
    } else if (paths.length > 1) {
      fragments.push(new ContainerAnnotation.Fragment(this, paths[0], "start"));
      fragments.push(new ContainerAnnotation.Fragment(this, last(paths), "end"));
      for (var i = 1; i < paths.length-1; i++) {
        fragments.push(new ContainerAnnotation.Fragment(this, paths[i], "inner"));
      }
    }
    return fragments;
  };

  this.getStartAnchor = function() {
    if (!this._startAnchor) {
      this._startAnchor = new ContainerAnnotation.Anchor(this, 'isStart');
    }
    return this._startAnchor;
  };

  this.getEndAnchor = function() {
    if (!this._endAnchor) {
      this._endAnchor = new ContainerAnnotation.Anchor(this);
    }
    return this._endAnchor;
  };
};

DocumentNode.extend(ContainerAnnotation);

ContainerAnnotation.static.name = "container-annotation";

ContainerAnnotation.static.defineSchema({
  // id of container node
  container: "container",
  startPath: ["string"],
  startOffset: "number",
  endPath: ["string"],
  endOffset: "number"
});

ContainerAnnotation.static.isContainerAnnotation = true;

/**
  @class
  @private
*/
ContainerAnnotation.Anchor = function(anno, isStart) {
  // Note: we are not calling Anchor() as it is not useful for us
  // as we need to delegate to the annos value dynamically
  // Anchor.call(this, path, offset)

  // initializing mixin
  EventEmitter.call(this);

  this.type = "container-annotation-anchor";
  this.anno = anno;
  // TODO: remove this.node in favor of this.anno
  this.node = anno;
  this.id = anno.id;
  this.container = anno.container;
  this.isStart = !!isStart;
  Object.freeze(this);
};

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

ContainerAnnotation.Fragment.static.fragmentation = Number.MAX_VALUE;

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

module.exports = ContainerAnnotation;
