'use strict';

var isString = require('lodash/isString');
var isArray = require('lodash/isArray');
var get = require('lodash/get');
var setWith = require('lodash/setWith');
var oo = require('./oo');
var deleteFromArray = require('./deleteFromArray');

function TreeNode() {}

/*
 * A tree-structure for indexes.
 *
 * @class TreeIndex
 * @param {object} [obj] An object to operate on
 * @memberof module:Basics
 * @example
 *
 * var index = new TreeIndex({a: "aVal", b: {b1: 'b1Val', b2: 'b2Val'}});
 */

function TreeIndex() {}

TreeIndex.Prototype = function() {

  /**
   * Get value at path.
   *
   * @return {object} The value stored for a given path
   *
   * @example
   *
   * obj.get(['b', 'b1']);
   * => b1Val
   */
  this.get = function(path) {
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0);
    }
    if (isString(path)) {
      path = [path];
    }
    return get(this, path);
  };

  this.getAll = function(path) {
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0);
    }
    if (isString(path)) {
      path = [path];
    }
    if (!isArray(path)) {
      throw new Error('Illegal argument for TreeIndex.get()');
    }
    var node = get(this, path);
    return this._collectValues(node);
  };

  this.set = function(path, value) {
    if (isString(path)) {
      path = [path];
    }
    setWith(this, path, value, function(val) {
      if (!val) return new TreeNode();
    });
  };

  this.delete = function(path) {
    if (isString(path)) {
      delete this[path];
    } else if(path.length === 1) {
      delete this[path[0]];
    } else {
      var key = path[path.length-1];
      path = path.slice(0, -1);
      var parent = get(this, path);
      if (parent) {
        delete parent[key];
      }
    }
  };

  this.clear = function() {
    var root = this;
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        delete root[key];
      }
    }
  };

  this.traverse = function(fn) {
    this._traverse(this, [], fn);
  };

  this.forEach = this.traverse;

  this._traverse = function(root, path, fn) {
    var id;
    for (id in root) {
      if (!root.hasOwnProperty(id)) continue;
      var child = root[id];
      var childPath = path.concat([id]);
      if (child instanceof TreeNode) {
        this._traverse(child, childPath, fn);
      } else {
        fn(child, childPath);
      }
    }
  };

  this._collectValues = function(root) {
    // TODO: don't know if this is the best solution
    // We use this only for indexes, e.g., to get all annotation on one node
    var vals = {};
    this._traverse(root, [], function(val, path) {
      var key = path[path.length-1];
      vals[key] = val;
    });
    return vals;
  };
};

oo.initClass(TreeIndex);

TreeIndex.Arrays = function() {};

TreeIndex.Arrays.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  this.get = function(path) {
    var val = _super.get.call(this, path);
    if (val instanceof TreeNode) {
      val = val.__values__ || [];
    }
    return val;
  };

  this.set = function() {
    throw new Error('TreeIndex.set() is not supported for array type.');
  };

  this.add = function(path, value) {
    if (isString(path)) {
      path = [path];
    }
    if (!isArray(path)) {
      throw new Error('Illegal arguments.');
    }
    var arr;

    // We are using setWith, as it allows us to create nodes on the way down
    // setWith can be controlled via a hook called for each key in the path
    // If val is not defined, a new node must be created and returned.
    // If val is defined, then we must return undefined to keep the original tree node
    // __dummy__ is necessary as setWith is used to set a value, but we want
    // to append to the array
    setWith(this, path.concat(['__values__','__dummy__']), undefined, function(val, key) {
      if (key === '__values__') {
        if (!val) val = [];
        arr = val;
      } else if (!val) {
        val = new TreeNode();
      }
      return val;
    });
    delete arr.__dummy__;
    arr.push(value);
  };

  this.remove = function(path, value) {
    var arr = get(this, path);
    if (arr instanceof TreeNode) {
      deleteFromArray(arr.__values__, value);
    }
  };

  this._collectValues = function(root) {
    var vals = [];
    this._traverse(root, [], function(val) {
      vals.push(val);
    });
    vals = Array.prototype.concat.apply([], vals);
    return vals;
  };

};

TreeIndex.extend(TreeIndex.Arrays);

module.exports = TreeIndex;
