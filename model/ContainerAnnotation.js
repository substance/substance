'use strict';

var isEqual = require('lodash/lang/isEqual');
var each = require('lodash/collection/each');
var last = require('lodash/array/last');
var EventEmitter = require('../util/EventEmitter');
var DocumentNode = require('./DocumentNode');
var Selection = require('./Selection');

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

var name = "container-annotation";

var schema = {
  // id of container node
  container: "container",
  startPath: ["string"],
  startOffset: "number",
  endPath: ["string"],
  endOffset: "number"
};

ContainerAnnotation.Prototype = function() {

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

  this.getStartPath = function() {
    return this.startPath;
  };

  this.getEndPath = function() {
    return this.endPath;
  };

  this.getStartOffset = function() {
    return this.startOffset;
  };

  this.getEndOffset = function() {
    return this.endOffset;
  };

  // Provide a selection which has the same range as this annotation.
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

  this.getText = function() {
    var doc = this.getDocument();
    if (!doc) {
      console.warn('Trying to use a ContainerAnnotation which is not attached to the document.');
      return "";
    }
    return doc.getTextForSelection(this.getSelection());
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

  this.setHighlighted = function(highlighted) {

    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted;
      this.emit('highlighted', highlighted);

      each(this.fragments, function(frag) {
        frag.emit('highlighted', highlighted);
      });
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

};

DocumentNode.extend(ContainerAnnotation);

ContainerAnnotation.static.name = name;

ContainerAnnotation.static.defineSchema(schema);
ContainerAnnotation.static.isContainerAnnotation = true;

/**
  @class
  @private
*/
ContainerAnnotation.Anchor = function Anchor(anno, isStart) {
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

  this.zeroWidth = true;

  this.getTypeNames = function() {
    return [this.type];
  };
};

EventEmitter.extend(ContainerAnnotation.Anchor);

/**
  @class
  @private
*/
ContainerAnnotation.Fragment = function Fragment(anno, path, mode) {
  EventEmitter.call(this);

  this.type = "container-annotation-fragment";
  this.anno = anno;
  // HACK: id is necessary for Annotator
  this.id = anno.id;
  this.path = path;
  this.mode = mode;
};

ContainerAnnotation.Fragment.Prototype = function() {

  this.getTypeNames = function() {
    return [this.type];
  };
};

EventEmitter.extend(ContainerAnnotation.Fragment);

Object.defineProperties(ContainerAnnotation.Fragment.prototype, {
  startOffset: {
    get: function() {
      return ( (this.mode === "start" || this.mode === "property") ? this.anno.startOffset : 0);
    },
    set: function() { throw new Error('Immutable!'); }
  },
  endOffset: {
    get: function() {
      var doc = this.anno.getDocument();
      var textProp = doc.get(this.path);
      var length = textProp.length;
      return ( (this.mode === "end" || this.mode === "property") ? this.anno.endOffset : length);
    },
    set: function() { throw new Error('Immutable!'); }
  },
  highlighted: {
    get: function() {
      return this.anno.highlighted;
    },
    set: function() { throw new Error('Immutable!'); }
  }
});

ContainerAnnotation.Fragment.static.level = Number.MAX_VALUE;

Object.defineProperties(ContainerAnnotation.Anchor.prototype, {
  path: {
    get: function() {
      return (this.isStart ? this.node.startPath : this.node.endPath);
    },
    set: function() { throw new Error('Immutable!'); }
  },
  offset: {
    get: function() {
      return (this.isStart ? this.node.startOffset : this.node.endOffset);
    },
    set: function() { throw new Error('Immutable!'); }
  },
});

module.exports = ContainerAnnotation;
