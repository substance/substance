'use strict';

var isEqual = require('lodash/isEqual');
var isObject = require('lodash/isObject');
var isArray = require('lodash/isArray');
var map = require('lodash/map');
var oo = require('../util/oo');
var uuid = require('../util/uuid');
var TreeIndex = require('../util/TreeIndex');
var OperationSerializer = require('./data/OperationSerializer');
var ObjectOperation = require('./data/ObjectOperation');

var PROVISIONAL = 1;
var PENDING = 2;
var FINAL = 3;

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
    // a unique id
    this.sha = data.sha;
    // the document version this change can be applied on
    this.version = data.version;
    // when the change has been applied
    this.timestamp = data.timestamp;
    // id of the user who applied this change
    if (data.userId) {
      this.userId = data.userId;
    }
    // application state before the change was applied
    this.before = data.before;
    // array of operations
    this.ops = data.ops;
    // application state after the change was applied
    this.after = data.after;

    this.state = data.state || FINAL;

    // this.freeze();
  } else if (arguments.length === 3) {
    this.sha = uuid();
    this.timestamp = Date.now();
    this.state = PROVISIONAL;
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
    var ops = [];
    for (var i = this.ops.length - 1; i >= 0; i--) {
      ops.push(this.ops[i].invert());
    }
    var before = this.after;
    var after = this.before;
    return new DocumentChange(ops, before, after);
  };

  this.isPending = function() {
    return this.state === PENDING;
  };

  this.makePending = function() {
    this.state = PENDING;
  };

  this.isFinal = function() {
    return this.state >= FINAL;
  };

  this.makeFinal = function() {
    this.state = FINAL;
  };

  // Inspection API used by DocumentChange listeners
  // ===============================================

  this.isAffected = function(path) {
    return !!this.updated.get(path);
  };

  this.isUpdated = this.isAffected;

  this.serialize = function() {
    var opSerializer = new OperationSerializer();
    var data = {
      sha: this.sha,
      version: this.version,
      timestamp: this.timestamp,
      before: {
        selection: this.before.selection
      },
      ops: this.ops.map(function(op) {
        return opSerializer.serialize(op);
      }),
      after: {
        selection: this.after.selection
      }
    };
    return JSON.stringify(data);
  };

  this.toJSON = function() {
    return {
      sha: this.sha,
      version: this.version,
      state: this.state,
      before: this.before,
      ops: map(this.ops, function(op) {
        return op.toJSON();
      }),
      after: this.after,
    };
  };
};

oo.initClass(DocumentChange);

DocumentChange.deserialize = function(str) {
  var opSerializer = new OperationSerializer();
  var data = JSON.parse(str);
  data.ops = data.ops.map(function(opData) {
    return opSerializer.deserialize(opData);
  });
  return new DocumentChange(data);
};

DocumentChange.fromJSON = function(data) {
  return new DocumentChange(data);
};

/*
  Transforms this change by another one, in the sense of rebasing this change
  w.r.t to the given other change.
  I.e, if a and b are both based on version v_n, while applying b results in version v_{n+1}
  then this call transforms this change so that it can be applied on v_{n+1} afterwards.
*/
DocumentChange.transform = function(A, B) {
  // TODO: also transform the selections (before and after)
  // TODO: some day collect conflicts so that we can report back to the user
  //       this would have the effect, that no conflicting change would be sent to
  //       the server, but would be resolved on the client first.
  //       Note: the only conflicts that need resolution are 'insert text' at the same position
  //       and 'set value' of the same property
  var a_ops = [];
  var b_ops = [];
  var i;
  if (!isArray(A)) {
    A = [A];
  }
  if (!isArray(B)) {
    B = [B];
  }
  for (i = 0; i < A.length; i++) {
    a_ops = a_ops.concat(A[i].ops);
  }
  for (i = 0; i < B.length; i++) {
    b_ops = b_ops.concat(B[i].ops);
  }
  for (i = 0; i < b_ops.length; i++) {
    var b_op = b_ops[i];
    // clone the other ops so they are not changed by the transform
    // TODO: maybe would be good to have more control which parts are manipulated inplace.
    b_op = b_op.clone();
    for (var j = 0; j < a_ops.length; j++) {
      var a_op = a_ops[j];
      // ATTENTION: order of arguments is important.
      // First argument is the dominant one, i.e. it is treated as if it was applied before
      ObjectOperation.transform(b_op, a_op, {inplace: true});
    }
  }
};


function _transformCoordinate(coor, op) {
  if (!isEqual(op.path, coor.path)) return false;
  var hasChanged = false;
  if (op.type === 'update' && op.propertyType === 'string') {
    var diff = op.diff;
    var newOffset;
    if (diff.isInsert() && diff.pos <= coor.offset) {
      newOffset = coor.offset + diff.str.length;
      console.log('Transforming coordinate after inserting %s chars:', diff.str.length, coor.toString(), '->', newOffset);
      coor.offset = newOffset;
      hasChanged = true;
    } else if (diff.isDelete() && diff.pos <= coor.offset) {
      newOffset = Math.max(diff.pos, coor.offset - diff.str.length);
      console.log('Transforming coordinate after deleting %s chars:', diff.str.length, coor.toString(), '->', newOffset);
      coor.offset = newOffset;
      hasChanged = true;
    }
  }
  return hasChanged;
}

// PRELIMINARY
// This needs a greater refactor, introducing Coordinates as built-in types
// which are considered together with operation transformations
DocumentChange.transformSelection = function(sel, A) {
  if (!sel || (!sel.isPropertySelection() && !sel.isContainerSelection()) ) {
    return false;
  }
  var ops = A.ops;
  var hasChanged = false;
  var isCollapsed = sel.isCollapsed();
  ops.forEach(function(op) {
    hasChanged |= _transformCoordinate(sel.start, op);
    if (!isCollapsed) {
      hasChanged |= _transformCoordinate(sel.end, op);
    } else {
      sel.range.end = sel.range.start;
    }
  });
  return hasChanged;
};

module.exports = DocumentChange;
