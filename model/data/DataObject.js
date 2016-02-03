'use strict';

var isString = require('lodash/isString');
var isArray = require('lodash/isArray');
var get = require('lodash/get');
var setWith = require('lodash/setWith');
var unset = require('lodash/unset');
var oo = require('../../util/oo');

/*
  An object that can be access via path API.

  @class
  @param {object} [obj] An object to operate on
  @example

  var obj = new DataObject({a: "aVal", b: {b1: 'b1Val', b2: 'b2Val'}});
*/

function DataObject(root) {
  if (root) {
    this.__root__ = root;
  }
}

DataObject.Prototype = function() {

  this.getRoot = function() {
    if (this.__root__) {
      return this.__root__;
    } else {
      return this;
    }
  };

  /**
    Get value at path

    @return {object} The value stored for a given path

    @example

    obj.get(['b', 'b1']);
    => b1Val
  */
  this.get = function(path) {
    if (!path) {
      return undefined;
    }
    if (isString(path)) {
      return this.getRoot()[path];
    }
    if (arguments.length > 1) {
      path = Array.prototype.slice(arguments, 0);
    }
    if (!isArray(path)) {
      throw new Error('Illegal argument for DataObject.get()');
    }
    return get(this.getRoot(), path);
  };

  this.set = function(path, value) {
    if (!path) {
      throw new Error('Illegal argument: DataObject.set(>path<, value) - path is mandatory.');
    }
    if (isString(path)) {
      this.getRoot()[path] = value;
    } else {
      setWith(this.getRoot(), path, value);
    }
  };

  this.delete = function(path) {
    if (isString(path)) {
      delete this.getRoot()[path];
    } else if (path.length === 1) {
      delete this.getRoot()[path[0]];
    } else {
      var success = unset(this.getRoot(), path);
      if (!success) {
        throw new Error('Could not delete property at path' + path);
      }
    }
  };

  this.clear = function() {
    var root = this.getRoot();
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        delete root[key];
      }
    }
  };

};

oo.initClass(DataObject);

module.exports = DataObject;
