'use strict';

var oo = require('../util/oo');
var isString = require('lodash/lang/isString');
var each = require('lodash/collection/each');
var values = require('lodash/object/values');
var extend = require('lodash/object/extend');
var PropertyAnnotation = require('./PropertyAnnotation');
var ContainerAnnotation = require('./ContainerAnnotation');
var TextOperation = require('./data/TextOperation');

var Record, Change;

var __id__ = 0;

function TextPropertyManager(surface) {
  if (!surface) {
    throw new Error('Illegal arguments: surface is mandatory.');
  }
  this.__id__ = __id__++;
  this.surface = surface;
  this.doc = surface.getDocument();

  if (surface.isContainerEditor()) {
    this.containerId = surface.getContainerId();
  }

  this.records = {};
  this.fragments = {};
  this.selectionFragments = [];
  this.highlights = {};

  this.doc.connect(this, {
    "document:changed": this.onDocumentChange
  }, { priority: -1 });

  this.hightlightManager = surface.getHighlightManager();
  if (this.hightlightManager) {
    this.hightlightManager.connect(this, {
      'highlights:updated': this.onHighlightsUpdated
    });
  }

  this._initialize();
}

TextPropertyManager.Prototype = function() {

  this.dispose = function() {
    this.doc.disconnect(this);
    this.hightlightManager.disconnect(this);
  };

  this._initializeFragment = function(fragment) {
    var path = fragment.path;
    var record = this.records[path];
    if (!record) {
      record = new Record(path);
      this.records[path] = record;
    }
    record.fragments[fragment.id] = fragment;
  };

  this._initialize = function() {
    if (this.hasContainer()) {
      each(this.doc.getNodes(), function(node) {
        if (node.isInstanceOf('container-annotation')) {
          if (node.container === this.containerId) {
            var anno = node;
            each(anno.getFragments(), this._initializeFragment, this);
          }
        }
      }, this);
    }
  };

  this.hasContainer = function() {
    return !!this.containerId;
  };

  this.renderSelection = function(sel) {
    if (!sel || sel.isNull()) {
      this.removeSelection();
      return;
    }
    var fragments = sel.getFragments();
    each(fragments, function(frag) {
      var record = this.records[frag.path];
      if (record) {
        record.fragments[frag.type] = frag;
        if (record.property) {
          record.property.setFragments(values(record.fragments));
        }
      }
    }, this);
    // console.log('Setting selection fragments', fragments);
    this.selectionFragments = fragments;
  };

  this.hasSelection = function() {
    return (this.selectionFragments.length > 0);
  };

  this.removeSelection = function() {
    if (!this.hasSelection()) return;
    each(this.selectionFragments, function(frag) {
      var record = this.records[frag.path];
      if (record) {
        delete record.fragments[frag.type];
        if (record.property) {
          record.property.setFragments(values(record.fragments));
        }
      }
    }, this);
    // console.log('Clearing selection fragments');
    this.selectionFragments = [];
  };

  this.registerProperty = function(property) {
    var path = property.getPath();
    var record = this.records[path];
    if (record && record.property && record.property !== property) {
      throw new Error('Property already registered.');
    }
    if (!record) {
      record = new Record(path);
      this.records[path] = record;
    }
    record.property = property;
  };

  this.unregisterProperty = function(property) {
    var path = property.getPath();
    var record = this.records[path];
    if (!record) {
      console.warn('No property registered for path ' + path.toString());
      return;
    }
    if (record.property !== property) {
      throw new Error('Registered property is different for path ' + path.toString());
    }
    record.property = null;
  };

  this.getFragments = function(path) {
    var record = this.records[path];
    if (record) {
      return values(record.fragments);
    } else {
      return [];
    }
  };

  this.getHighlights = function(path) {
    var record = this.records[path];
    if (record) {
      return record.highlights || {};
    } else {
      return {};
    }
  };

  this.onDocumentChange = function(change) {
    var _changes = this._record(change);
    this._dispatch(_changes, change);
  };

  this.onHighlightsUpdated = function(highlights) {
    // TODO: we need to find out where the highlights should go to
    // Right now we only consider annotations to be highlighted
    // on the long run we will want to highligh full nodes, too
    // Then this task can't be done by the TextPropertyManager
    console.log('TextPropertyManager.onHighlightsUpdated', highlights);
    var doc = this.doc;
    var _highlights = {};
    each(highlights, function(nodeId, scope) {
      var node = doc.get(nodeId);
      if (node instanceof PropertyAnnotation) {
        var hls = _highlights[node.path];
        if (!hls) {
          hls = {};
          _highlights[node.path] = hls;
        }
        hls[nodeId] = scope;
      }
      // TODO: deal with highlights for ContainerAnnotations
      // ... and in future think about how to dispatch highlights for nodes
    }, this);
    each(_highlights, function(hls, path) {
      var record = this.records[path];
      record.highlights = hls;
      if (record && record.property) {
        record.property.setHighlights(hls);
      }
    }, this);
  };

  function _createChanges() {
    var changes = Object.create({
      get: function(path) {
        var change = changes[path];
        if (!change) {
          change = new Change(path);
          changes[path] = change;
        }
        return change;
      }
    });
    return changes;
  }

  this._record = function(documentChange) {
    var changes = _createChanges();
    for (var i = 0; i < documentChange.ops.length; i++) {
      var op = documentChange.ops[i];
      // text changed
      if ( (op.type === "update" && op.diff instanceof TextOperation) ||
           (op.type === "set" && isString(op.val)) ) {
        this._recordTextChange(changes, op);
        continue;
      }
      // property anno created/deleted/changed
      // HACK: doing a lazy check for property annotations assuming a property 'path'
      if ( (op.type === "create" || op.type === "delete") && op.val.path ) {
        this._recordAnnoChange(changes, op);
        continue;
      }
      if ( ( op.type === "set" && op.path[1] === 'path' ) ) {
        this._recordAnnoChange(changes, op);
        continue;
      }
      // container anno changed
      // HACK: doing a lazy check for container annotations assuming a property 'startPath'|'endPath'
      if ( ( (op.type === "create" || op.type === "delete") && op.val.startPath ) ||
           ( (op.type === "update" || op.type === "set") &&
             (op.path[1] === 'startPath' || op.path[1] === 'endPath') ) ) {
        this._recordContainerAnnoChange(changes, op);
        continue;
      }
      // both type of annotations do have start and end offset
      if ( (op.type === "update" || op.type === "set") &&
           (op.path[1] === 'startOffset' || op.path[1] === 'endOffset') ) {
        this._recordMixedAnnoChange(changes, op);
        continue;
      }

      // container change
      // TODO
      // listen to any array update on a node which is either the container
      // or a node which has the container as root
    }
    return changes;
  };

  this._recordTextChange = function(changes, op) {
    changes.get(op.path).rerender = true;
  };

  this._recordMixedAnnoChange = function(changes, op) {
    var doc = this.doc;
    var anno = doc.get(op.path[0]);
    if (!anno) {
      return;
    }
    if (anno instanceof ContainerAnnotation) {
      this._recordContainerAnnoChange(changes, op);
    } else {
      this._recordAnnoChange(changes, op);
    }
  };

  this._recordAnnoChange = function(changes, op) {
    var doc = this.doc;
    if (op.type === "create" || op.type === "delete") {
      changes.get(op.val.path).rerender = true;
    } else if (op.type === "set" && op.path[1] === 'path') {
      changes.get(op.original).rerender = true;
      changes.get(op.val).rerender = true;
    } else if (op.type === "set" &&
      (op.path[1] === "startOffset" || op.path[1] === "endOffset") ) {
      var anno = doc.get(op.path[0]);
      // make sure that the anno is still there
      if (anno) {
        changes.get(anno.path).rerender = true;
      }
    }
  };

  this._recordContainerAnnoChange = function(changes, op) {
    var doc = this.doc;
    var change, fragments, anno, i;
    if (op.type === "create") {
      anno = doc.get(op.val.id);
      fragments = anno.getFragments();
      for (i = 0; i < fragments.length; i++) {
        change = changes.get(fragments[i].path);
        change.didAddFragment(fragments[i]);
      }
    } else if (op.type === "delete") {
      fragments = this.fragments[op.val.id];
      for (i = 0; i < fragments.length; i++) {
        change = changes.get(fragments[i].path);
        change.didRemoveFragment(fragments[i]);
      }
    } else if (op.type === "set") {
      // if startPath or endPath have changed we simply update
      // all fragments for sake of simplicity
      if (op.path[1] === 'startPath' || 'endPath') {
        anno = doc.get(op.path[0]);
        fragments = this.fragments[anno.id] || [];
        for (i = 0; i < fragments.length; i++) {
          change = changes.get(fragments[i].path);
          change.didRemoveFragment(fragments[i]);
        }
        fragments = anno.getFragments();
        for (i = 0; i < fragments.length; i++) {
          change = changes.get(fragments[i].path);
          change.didAddFragment(fragments[i]);
        }
      } else if (op.path[1] === 'startOffset') {
        anno = doc.get(op.path[0]);
        changes.get(anno.startPath).rerender = true;
      } else if (op.path[1] === 'endOffset') {
        anno = doc.get(op.path[0]);
        changes.get(anno.endPath).rerender = true;
      }
    }
  };

  this._dispatch = function(changes, documentChange) {
    for (var path in changes) {
      if (!changes.hasOwnProperty(path) || !this.records[path]) {
        continue;
      }
      var change = changes[path];
      // skip updates on nodes which already have been deleted
      if (documentChange.deleted[change.path[0]]) {
        continue;
      }
      var record = this.records[path];
      if (!record) {
        console.warn("TextPropertyManager: something is fishy here. Saw a change, but don't know property:", path);
        continue;
      }
      var fragmentsChanged = false;
      var oldFragments = record.fragments;
      var newFragments = extend({}, oldFragments);
      if (change.removedFragments) {
        for (var id in change.removedFragments) {
          delete newFragments[id];
        }
        record.fragments = newFragments;
        fragmentsChanged = true;
      }
      if (change.addedFragments) {
        extend(newFragments, change.addedFragments);
        record.fragments = newFragments;
        fragmentsChanged = true;
      }
      if (fragmentsChanged) {
        record.property.setFragments(values(record.fragments));
      } else if (change.rerender) {
        record.property.update();
      }
    }
  };
};

oo.initClass(TextPropertyManager);

var Record = function(path) {
  this.path = path;
  this.property = null;
  this.fragments = {};
};

oo.initClass(Record);

var Change = function(path) {
  this.path = path;
  this.rerender = false;
  this.addedFragments = null;
  this.removedFragments = null;
};

Change.Prototype = function() {
  this.didAddFragment = function(frag) {
    if (!this.addedFragments) {
      this.addedFragments = {};
    }
    this.addedFragments[frag.id] = frag;
  };
  this.didRemoveFragment = function(frag) {
    if (!this.removedFragments) {
      this.removedFragments = {};
    }
    this.removedFragments[frag.id] = frag;
  };
};

oo.initClass(Change);

module.exports = TextPropertyManager;
