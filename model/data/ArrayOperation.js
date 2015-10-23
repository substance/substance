'use strict';

var _ = require('../../util/helpers');
var oo = require('../../util/oo');
var Operation = require('./Operation');
var Conflict = require('./Conflict');

var NOP = "NOP";
var DEL = "delete";
var INS = "insert";

var ArrayOperation = function(data) {
  Operation.call(this);

  /* jshint eqnull: true */
  if (!data || data.type == null) {
    throw new Error("Illegal argument: insufficient data.");
  }
  /* jshint eqnull: false */
  this.type = data.type;
  if (this.type === NOP) return;

  if (this.type !== INS && this.type !== DEL) {
    throw new Error("Illegal type.");
  }
  // the position where to apply the operation
  this.pos = data.pos;
  // the value to insert or delete
  this.val = data.val;
  if (!_.isNumber(this.pos) || this.pos < 0) {
    throw new Error("Illegal argument: expecting positive number as pos.");
  }
};

ArrayOperation.fromJSON = function(data) {
  return new ArrayOperation(data);
};

ArrayOperation.Prototype = function() {

  this.apply = function(array) {
    if (this.type === NOP) {
      return array;
    }
    if (this.type === INS) {
      if (array.length < this.pos) {
        throw new Error("Provided array is too small.");
      }
      array.splice(this.pos, 0, this.val);
      return array;
    }
    // Delete
    else /* if (this.type === DEL) */ {
      if (array.length < this.pos) {
        throw new Error("Provided array is too small.");
      }
      if (!_.isEqual(array[this.pos], this.val)) {
        throw Error("Unexpected value at position " + this.pos + ". Expected " + this.val + ", found " + array[this.pos]);
      }
      array.splice(this.pos, 1);
      return array;
    }
  };

  this.clone = function() {
    var data = {
      type: this.type,
      pos: this.pos,
      val: _.deepclone(this.val)
    };
    return new ArrayOperation(data);
  };

  this.invert = function() {
    var data = this.toJSON();
    if (this.type === NOP) data.type = NOP;
    else if (this.type === INS) data.type = DEL;
    else /* if (this.type === DEL) */ data.type = INS;
    return new ArrayOperation(data);
  };

  this.hasConflict = function(other) {
    return ArrayOperation.hasConflict(this, other);
  };

  this.toJSON = function() {
    var result = {
      type: this.type,
    };
    if (this.type === NOP) return result;
    result.pos = this.pos;
    result.val = _.deepclone(this.val);
    return result;
  };

  this.isInsert = function() {
    return this.type === INS;
  };

  this.isDelete = function() {
    return this.type === DEL;
  };

  this.getOffset = function() {
    return this.pos;
  };

  this.getValue = function() {
    return this.val;
  };

  this.isNOP = function() {
    return this.type === NOP;
  };

  this.toString = function() {
    return ["(", (this.isInsert() ? '+' : '-'), ",", this.getOffset(), ",'", this.getValue(), "')"].join('');
  };
};

oo.inherit(ArrayOperation, Operation);

var hasConflict = function(a, b) {
  if (a.type === NOP || b.type === NOP) return false;
  if (a.type === INS && b.type === INS) {
    return a.pos === b.pos;
  } else {
    return false;
  }
};

function transform_insert_insert(a, b) {
  if (a.pos === b.pos) {
    b.pos += 1;
  }
  // a before b
  else if (a.pos < b.pos) {
    b.pos += 1;
  }
  // a after b
  else  {
    a.pos += 1;
  }
}

function transform_delete_delete(a, b) {
  // turn the second of two concurrent deletes into a NOP
  if (a.pos === b.pos) {
    b.type = NOP;
    a.type = NOP;
    return;
  }
  if (a.pos < b.pos) {
    b.pos -= 1;
  } else {
    a.pos -= 1;
  }
}

function transform_insert_delete(a, b) {
  // reduce to a normalized case
  if (a.type === DEL) {
    var tmp = a;
    a = b;
    b = tmp;
  }
  if (a.pos <= b.pos) {
    b.pos += 1;
  } else {
    a.pos -= 1;
  }
}

var transform = function(a, b, options) {
  options = options || {};
  // enable conflicts when you want to notify the user of potential problems
  // Note that even in these cases, there is a defined result.
  if (options['no-conflict'] && hasConflict(a, b)) {
    throw new Conflict(a, b);
  }
  // this is used internally only as optimization, e.g., when rebasing an operation
  if (!options.inplace) {
    a = a.clone();
    b = b.clone();
  }
  if (a.type === NOP || b.type === NOP)  {
    // nothing to transform
  }
  else if (a.type === INS && b.type === INS)  {
    transform_insert_insert(a, b);
  }
  else if (a.type === DEL && b.type === DEL) {
    transform_delete_delete(a, b);
  }
  else {
    transform_insert_delete(a, b);
  }
  return [a, b];
};

ArrayOperation.transform = transform;
ArrayOperation.hasConflict = hasConflict;

/* Factories */

ArrayOperation.Insert = function(pos, val) {
  return new ArrayOperation({type:INS, pos: pos, val: val});
};

ArrayOperation.Delete = function(pos, val) {
  return new ArrayOperation({ type:DEL, pos: pos, val: val });
};

ArrayOperation.NOP = NOP;
ArrayOperation.DELETE = DEL;
ArrayOperation.INSERT = INS;

// Export
// ========

module.exports = ArrayOperation;
