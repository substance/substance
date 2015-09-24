'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var EventEmitter = require('../basics/event_emitter');
var Node = require('./node');
var Selection = require('./selection');
var PathAdapter = require('../basics/path_adapter');


// Container Annotation
// ----------------
//
// Describes an annotation sticking on a container that can span over multiple
// nodes.
//
// Here's an example:
//
// {
//   "id": "subject_reference_1",
//   "type": "subject_reference",
//   "container": "content",
//   "startPath": ["text_2", "content"],
//   "startOffset": 100,
//   "endPath": ["text_4", "content"],
//   "endOffset": 40
// }


var ContainerAnnotation = Node.extend({
  displayName: "ContainerAnnotation",
  name: "container_annotation",

  properties: {
    // id of container node
    container: 'string',
    startPath: ['array', 'string'],
    startOffset: 'number',
    endPath: ['array', 'string'],
    endOffset: 'number'
  },

  getStartAnchor: function() {
    if (!this._startAnchor) {
      this._startAnchor = new ContainerAnnotation.Anchor(this, 'isStart');
    }
    return this._startAnchor;
  },

  getEndAnchor: function() {
    if (!this._endAnchor) {
      this._endAnchor = new ContainerAnnotation.Anchor(this);
    }
    return this._endAnchor;
  },

  // Provide a selection which has the same range as this annotation.
  getSelection: function() {
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
  },

  getText: function() {
    var doc = this.getDocument();
    if (!doc) {
      console.warn('Trying to use a ContainerAnnotation which is not attached to the document.');
      return "";
    }
    return doc.getTextForSelection(this.getSelection());
  },

  updateRange: function(tx, sel) {
    if (!sel.isContainerSelection()) {
      throw new Error('Cannot change to ContainerAnnotation.');
    }
    if (!_.isEqual(this.startPath, sel.start.path)) {
      tx.set([this.id, 'startPath'], sel.start.path);
    }
    if (this.startOffset !== sel.start.offset) {
      tx.set([this.id, 'startOffset'], sel.start.offset);
    }
    if (!_.isEqual(this.endPath, sel.end.path)) {
      tx.set([this.id, 'endPath'], sel.end.path);
    }
    if (this.endOffset !== sel.end.offset) {
      tx.set([this.id, 'endOffset'], sel.end.offset);
    }
  },


  setHighlighted: function(highlighted) {

    if (this.highlighted !== highlighted) {
      this.highlighted = highlighted;
      this.emit('highlighted', highlighted);

      _.each(this.fragments, function(frag) {
        frag.emit('highlighted', highlighted);
      });
    }
  },

  // FIXME: this implementation will not prune old fragments
  getFragments: function() {
    if (!this._fragments) {
      this._fragments = new PathAdapter();
    }
    var fragments = [];
    var doc = this.getDocument();
    var startAnchor = this.getStartAnchor();
    var endAnchor = this.getEndAnchor();
    var container = doc.get(this.container);
    var fragment;
    // if start and end anchors are on the same property, then there is only one fragment
    if (_.isEqual(startAnchor.path, endAnchor.path)) {
      fragment = this._fragments.get(startAnchor.path);
      if (!fragment) {
        fragment = new ContainerAnnotation.Fragment(this, startAnchor.path, "property");
        this._fragments.set(fragment.path, fragment);
      } else if (fragment.mode !== "property") {
        fragment.mode = "property";
      }
      fragments.push(fragment);
    }
    // otherwise create a trailing fragment for the property of the start anchor,
    // full-spanning fragments for inner properties,
    // and one for the property containing the end anchor.
    else {
      var text = doc.get(startAnchor.path);
      var startComp = container.getComponent(startAnchor.path);
      var endComp = container.getComponent(endAnchor.path);
      if (!startComp || !endComp) {
        throw new Error('Could not find components of AbstractContainerAnnotation');
      }
      fragment = this._fragments.get(startAnchor.path);
      if (!fragment) {
        fragment = new ContainerAnnotation.Fragment(this, startAnchor.path, "start");
        this._fragments.set(fragment.path, fragment);
      } else if (fragment.mode !== "start") {
        fragment.mode = "start";
      }
      fragments.push(fragment);
      for (var idx = startComp.idx + 1; idx < endComp.idx; idx++) {
        var comp = container.getComponentAt(idx);
        text = doc.get(comp.path);
        fragment = this._fragments.get(comp.path);
        if (!fragment) {
          fragment = new ContainerAnnotation.Fragment(this, comp.path, "inner");
          this._fragments.set(fragment.path, fragment);
        } else if (fragment.mode !== "inner") {
          fragment.mode = "inner";
        }
        fragments.push(fragment);
      }
      fragment = this._fragments.get(endAnchor.path);
      if (!fragment) {
        fragment = new ContainerAnnotation.Fragment(this, endAnchor.path, "end");
        this._fragments.set(fragment.path, fragment);
      } else if (fragment.mode !== "end") {
        fragment.mode = "end";
      }
      fragments.push(fragment);
    }
    this.fragments = fragments;
    return fragments;
  },

});

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
  _.extend(this, EventEmitter.prototype);

  this.zeroWidth = true;

  this.getTypeNames = function() {
    return [this.type];
  };
};

OO.initClass(ContainerAnnotation.Anchor);

ContainerAnnotation.Fragment = function Fragment(anno, path, mode) {
  EventEmitter.call(this);

  this.type = "container_annotation_fragment";
  this.anno = anno;
  // HACK: id is necessary for Annotator
  this.id = anno.id;
  this.path = path;
  this.mode = mode;
};

ContainerAnnotation.Fragment.Prototype = function() {
  _.extend(this, EventEmitter.prototype);

  this.getTypeNames = function() {
    return [this.type];
  };
};

OO.initClass(ContainerAnnotation.Fragment);

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