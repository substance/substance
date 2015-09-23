'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');
var TextOperation = require('../operator/text_operation');
// var ArrayOperation = require('../operator/array_operation');

var Record, Change;

function TextPropertyManager(doc, containerId) {
  if (!doc) {
    throw new Error('Illegal arguments: doc is mandatory.');
  }
  this.doc = doc;
  this.containerId = containerId;

  this.records = {};
  this.fragments = {};

  this.doc.connect(this, {
    "document:changed": this.onDocumentChange
  }, { priority: -1 });

  this._initialize();
}

TextPropertyManager.Prototype = function() {

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
      _.each(this.doc.getNodes(), function(node) {
        if (node.isInstanceOf('container_annotation')) {
          if (node.container === this.containerId) {
            var anno = node;
            _.each(anno.getFragments(), this._initializeFragment, this);
          }
        }
      }, this);
    }
  };

  this.hasContainer = function() {
    return !!this.containerId;
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
      return _.values(record.fragments);
    } else {
      return [];
    }
  };

  this.onDocumentChange = function(change) {
    var _changes = this._record(change);
    this._dispatch(_changes);
  };

  function _createChanges() {
    var changes = Object.create({
      get: function(path) {
        var change = changes[path];
        if (!change) {
          change = new Change();
          changes[path] = change;
        }
        return change;
      }
    });
    return changes;
  }

  this._record = function(change) {
    var changes = _createChanges();
    for (var i = 0; i < change.ops.length; i++) {
      var op = change.ops[i];

      // text changed
      if ( (op.type === "update" && op.diff instanceof TextOperation) ||
           (op.type === "set" && _.isString(op.val)) ) {
        this._recordTextChange(changes, op);
        continue;
      }

      // property anno created/deleted/changed
      // HACK: doing a lazy check for property annotations assuming a property 'path'
      if ( (op.type === "create" || op.type === "delete") && op.val.path ) {
        // ignore annotations on deleted nodes
        if (!change.deleted[op.val.path[0]]) {
          this._recordAnnoChange(changes, op);
        }
        continue;
      }

      if ( ( (op.type === "set") &&
             (op.path[1] === 'path' || op.path[1] === 'startOffset' ||
              op.path[1] === 'endOffset') ) ) {
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
      changes.get(anno.path).rerender = true;
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
        fragments = this.fragments[anno.id];
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

  this._dispatch = function(changes) {
    for (var path in changes) {
      if (!changes.hasOwnProperty(path)) {
        continue;
      }
      var change = changes[path];
      var record = this.records[path];
      if (!record) {
        console.warn("TextPropertyManager: something is fishy here. Saw a change, but don't know property:", path);
        continue;
      }
      var fragmentsChanged = false;
      var oldFragments = record.fragments;
      var newFragments = _.extend({}, oldFragments);
      if (change.removedFragments) {
        for (var id in change.removedFragments) {
          delete newFragments[id];
        }
        record.fragments = newFragments;
        fragmentsChanged = true;
      }
      if (change.addedFragments) {
        _.extend(newFragments, change.addedFragments);
        record.fragments = newFragments;
        fragmentsChanged = true;
      }
      if (fragmentsChanged) {
        record.property.setFragments(_.values(record.fragments));
      } else if (change.rerender) {
        record.property.update();
      }
    }
  };
};

OO.initClass(TextPropertyManager);

var Record = function(path) {
  this.path = path;
  this.property = null;
  this.fragments = {};
};

OO.initClass(Record);

var Change = function() {
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

OO.initClass(Change);

module.exports = TextPropertyManager;
