/* jshint latedef:nofunc */

'use strict';

var isEqual = require('lodash/isEqual');
var isObject = require('lodash/isObject');
var isArray = require('lodash/isArray');
var map = require('lodash/map');
var clone = require('lodash/clone');
var cloneDeep = require('lodash/cloneDeep');
var oo = require('../util/oo');
var uuid = require('../util/uuid');
var TreeIndex = require('../util/TreeIndex');
var OperationSerializer = require('./data/OperationSerializer');
var ObjectOperation = require('./data/ObjectOperation');
var Selection = require('./Selection');

/*

  States:

  - Provisional:

    Change has been applied to the document already. Subsequent changes might be merged
    into it, to achieve a more natural representation.

  - Final:

    Change has been finalized.

  - Pending:

    Change has been committed to the collaboration hub.

  - Acknowledged:

    Change has been applied and acknowledged by the server.
*/
function DocumentChange(ops, before, after) {
  if (arguments.length === 1 && isObject(arguments[0])) {
    var data = arguments[0];
    // sessionId
    this.sessionId = data.sessionId;
    // a unique id
    this.sha = data.sha;
    // when the change has been applied
    this.timestamp = data.timestamp;
    // application state before the change was applied
    this.before = data.before;
    // array of operations
    this.ops = data.ops;
    // application state after the change was applied
    this.after = data.after;
  } else if (arguments.length === 3) {
    this.sha = uuid();
    this.timestamp = Date.now();
    this.ops = ops.slice(0);
    this.before = before;
    this.after = after;
  } else {
    throw new Error('Illegal arguments.');
  }
  // a hash with all updated properties
  this.updated = null;
  // a hash with all created nodes
  this.created = null;
  // a hash with all deleted nodes
  this.deleted = null;
}

DocumentChange.Prototype = function() {

  /*
    Extract aggregated information about which nodes and properties have been affected.
    This gets called by Document after applying the change.
  */
  this._extractInformation = function(doc) {
    var ops = this.ops;
    var created = {};
    var deleted = {};
    var updated = new TreeIndex();
    var affectedContainerAnnos = [];

    // TODO: we will introduce a special operation type for coordinates
    function _checkAnnotation(op) {
      var node = op.val;
      var path, propName;
      switch (op.type) {
        case "create":
        case "delete":
          // HACK: detecting annotation changes in an opportunistic way
          if (node.hasOwnProperty('startOffset')) {
            path = node.path || node.startPath;
            updated.set(path, true);
          }
          if (node.hasOwnProperty('endPath')) {
            path = node.endPath;
            updated.set(path, true);
          }
          break;
        case "update":
        case "set":
          // HACK: detecting annotation changes in an opportunistic way
          node = doc.get(op.path[0]);
          if (node) {
            propName = op.path[1];
            if (node.isPropertyAnnotation()) {
              if ((propName === 'path' || propName === 'startOffset' ||
                   propName === 'endOffset') && !deleted[node.path[0]]) {
                updated.set(node.path, true);
              }
            } else if (node.isContainerAnnotation()) {
              if (propName === 'startPath' || propName === 'startOffset' ||
                  propName === 'endPath' || propName === 'endOffset') {
                affectedContainerAnnos.push(node);
              }
            }
          }
          break;
      }
    }

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.type === "create") {
        created[op.val.id] = op.val;
        delete deleted[op.val.id];
      }
      if (op.type === "delete") {
        delete created[op.val.id];
        delete updated[op.val.id];
        deleted[op.val.id] = op.val;
      }
      if (op.type === "set" || op.type === "update") {
        // The old as well the new one is affected
        updated.set(op.path, true);
      }
      _checkAnnotation(op);
    }

    affectedContainerAnnos.forEach(function(anno) {
      var container = doc.get(anno.container);
      var paths = container.getPathRange(anno.startPath, anno.endPath);
      paths.forEach(function(path) {
        if (!deleted[path[0]]) {
          updated.set(path, true);
        }
      });
    });

    this.created = created;
    this.deleted = deleted;
    this.updated = updated;
  };

  this.invert = function() {
    // shallow cloning this
    var copy = this.toJSON();
    copy.ops = [];
    // swapping before and after
    var tmp = copy.before;
    copy.before = copy.after;
    copy.after = tmp;
    var inverted = DocumentChange.fromJSON(copy);
    var ops = [];
    for (var i = this.ops.length - 1; i >= 0; i--) {
      ops.push(this.ops[i].invert());
    }
    inverted.ops = ops;
    return inverted;
  };

  // Inspection API used by DocumentChange listeners
  // ===============================================

  this.isAffected = function(path) {
    return !!this.updated.get(path);
  };

  this.isUpdated = this.isAffected;

  /*
    TODO serializers and deserializers should allow
    for application data in 'after' and 'before'
  */

  this.serialize = function() {
    var opSerializer = new OperationSerializer();
    var data = this.toJSON();
    data.ops = this.ops.map(function(op) {
      return opSerializer.serialize(op);
    });
    return JSON.stringify(data);
  };

  this.clone = function() {
    return DocumentChange.fromJSON(this.toJSON());
  };

  this.toJSON = function() {
    var data = {
      // to connect the selection with a user
      sessionId: this.sessionId,
      // to identify this change
      sha: this.sha,
      // before state
      before: clone(this.before),
      ops: map(this.ops, function(op) {
        return op.toJSON();
      }),
      // after state
      after: clone(this.after),
    };
    var sel = this.before.selection;
    if (sel && sel instanceof Selection) {
      data.before.selection = sel.toJSON();
    }
    sel = this.after.selection;
    if (sel && sel instanceof Selection) {
      data.after.selection = sel.toJSON();
    }
    return data;
  };
};

oo.initClass(DocumentChange);

DocumentChange.deserialize = function(str) {
  var opSerializer = new OperationSerializer();
  var data = JSON.parse(str);
  data.ops = data.ops.map(function(opData) {
    return opSerializer.deserialize(opData);
  });
  if (data.before.selection) {
    data.before.selection = Selection.fromJSON(data.before.selection);
  }
  if (data.after.selection) {
    data.after.selection = Selection.fromJSON(data.after.selection);
  }
  return new DocumentChange(data);
};

DocumentChange.fromJSON = function(data) {
  data.ops = data.ops.map(function(opData) {
    return ObjectOperation.fromJSON(opData);
  });
  data.before.selection = Selection.fromJSON(data.before.selection);
  data.after.selection = Selection.fromJSON(data.after.selection);
  return new DocumentChange(data);
};

/*
  Transforms change A with B, as if A was done before B.
  A' and B' can be used to update two clients to get to the
  same document content.

     / A - B' \
  v_n          v_n+1
     \ B - A' /
*/
DocumentChange.transformInplace = function(A, B) {
  _transformInplaceBatch(A, B);
};

function _transformInplaceSingle(a, b) {
  for (var i = 0; i < a.ops.length; i++) {
    var a_op = a.ops[i];
    for (var j = 0; j < b.ops.length; j++) {
      var b_op = b.ops[j];
      // ATTENTION: order of arguments is important.
      // First argument is the dominant one, i.e. it is treated as if it was applied before
      ObjectOperation.transform(a_op, b_op, {inplace: true});
    }
  }
  if (a.before) {
    _transformSelectionInplace(a.before.selection, b);
  }
  if (a.after) {
    _transformSelectionInplace(a.after.selection, b);
  }
  if (b.before) {
    _transformSelectionInplace(b.before.selection, a);
  }
  if (b.after) {
    _transformSelectionInplace(b.after.selection, a);
  }
}

function _transformInplaceBatch(A, B) {
  if (!isArray(A)) {
    A = [A];
  }
  if (!isArray(B)) {
    B = [B];
  }
  for (var i = 0; i < A.length; i++) {
    var a = A[i];
    for (var j = 0; j < B.length; j++) {
      var b = B[j];
      _transformInplaceSingle(a,b);
    }
  }
}

function _transformSelectionInplace(sel, a) {
  if (!sel || (!sel.isPropertySelection() && !sel.isContainerSelection()) ) {
    return false;
  }
  var ops = a.ops;
  var hasChanged = false;
  var isCollapsed = sel.isCollapsed();
  for(var i=0; i<ops.length; i++) {
    var op = ops[i];
    hasChanged |= _transformCoordinateInplace(sel.start, op);
    if (!isCollapsed) {
      hasChanged |= _transformCoordinateInplace(sel.end, op);
    } else {
      if (sel.isContainerSelection()) {
        sel.endPath = sel.startPath;
      }
      sel.endOffset = sel.startOffset;
    }
  }
  return hasChanged;
}

DocumentChange.transformSelection = _transformSelectionInplace;

function _transformCoordinateInplace(coor, op) {
  if (!isEqual(op.path, coor.path)) return false;
  var hasChanged = false;
  if (op.type === 'update' && op.propertyType === 'string') {
    var diff = op.diff;
    var newOffset;
    if (diff.isInsert() && diff.pos <= coor.offset) {
      newOffset = coor.offset + diff.str.length;
      // console.log('Transforming coordinate after inserting %s chars:', diff.str.length, coor.toString(), '->', newOffset);
      coor.offset = newOffset;
      hasChanged = true;
    } else if (diff.isDelete() && diff.pos <= coor.offset) {
      newOffset = Math.max(diff.pos, coor.offset - diff.str.length);
      // console.log('Transforming coordinate after deleting %s chars:', diff.str.length, coor.toString(), '->', newOffset);
      coor.offset = newOffset;
      hasChanged = true;
    }
  }
  return hasChanged;
}

module.exports = DocumentChange;
