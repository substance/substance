'use strict';

import isNumber from 'lodash/isNumber'
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'

import Operation from './Operation'
import Conflict from './Conflict'

var NOP = "NOP";
var DELETE = "delete";
var INSERT = "insert";

/*
  @class
  @extends Operation
*/
function ArrayOperation(data) {
  Operation.call(this);

  if (!data || !data.type) {
    throw new Error("Illegal argument: insufficient data.");
  }
  this.type = data.type;
  if (this.type === NOP) return;

  if (this.type !== INSERT && this.type !== DELETE) {
    throw new Error("Illegal type.");
  }
  // the position where to apply the operation
  this.pos = data.pos;
  // the value to insert or delete
  this.val = data.val;
  if (!isNumber(this.pos) || this.pos < 0) {
    throw new Error("Illegal argument: expecting positive number as pos.");
  }
}

ArrayOperation.fromJSON = function(data) {
  return new ArrayOperation(data);
};

ArrayOperation.Prototype = function() {

  this._isArrayOperation = true;

  this.apply = function(array) {
    if (this.type === NOP) {
      return array;
    }
    if (this.type === INSERT) {
      if (array.length < this.pos) {
        throw new Error("Provided array is too small.");
      }
      array.splice(this.pos, 0, this.val);
      return array;
    }
    // Delete
    else /* if (this.type === DELETE) */ {
      if (array.length < this.pos) {
        throw new Error("Provided array is too small.");
      }
      if (!isEqual(array[this.pos], this.val)) {
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
      val: cloneDeep(this.val)
    };
    return new ArrayOperation(data);
  };

  this.invert = function() {
    var data = this.toJSON();
    if (this.type === NOP) data.type = NOP;
    else if (this.type === INSERT) data.type = DELETE;
    else /* if (this.type === DELETE) */ data.type = INSERT;
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
    result.val = cloneDeep(this.val);
    return result;
  };

  this.isInsert = function() {
    return this.type === INSERT;
  };

  this.isDelete = function() {
    return this.type === DELETE;
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
    return ["(", (this.isInsert() ? INSERT : DELETE), ",", this.getOffset(), ",'", this.getValue(), "')"].join('');
  };
};

Operation.extend(ArrayOperation);

var hasConflict = function(a, b) {
  if (a.type === NOP || b.type === NOP) return false;
  if (a.type === INSERT && b.type === INSERT) {
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
  else {
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
  if (a.type === DELETE) {
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
  if (a.type === NOP || b.type === NOP) {
    // nothing to transform
  }
  else if (a.type === INSERT && b.type === INSERT) {
    transform_insert_insert(a, b);
  }
  else if (a.type === DELETE && b.type === DELETE) {
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
  return new ArrayOperation({type:INSERT, pos: pos, val: val});
};

ArrayOperation.Delete = function(pos, val) {
  return new ArrayOperation({ type:DELETE, pos: pos, val: val });
};

ArrayOperation.NOP = NOP;
ArrayOperation.DELETE = DELETE;
ArrayOperation.INSERT = INSERT;

// Export
// ========

export default ArrayOperation;
