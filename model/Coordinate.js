'use strict';

var isArray = require('lodash/isArray');
var isNumber = require('lodash/isNumber');
var isEqual = require('lodash/isEqual');
var oo = require('../util/oo');

// path: the address of a property, such as ['text_1', 'content']
// offset: the position in the property
// after: an internal flag indicating if the address should be associated to the left or right side
//   Note: at boundaries of annotations there are two possible positions with the same address
//       foo <strong>bar</strong> ...
//     With offset=7 normally we associate this position:
//       foo <strong>bar|</strong> ...
//     With after=true we can describe this position:
//       foo <strong>bar</strong>| ...
function Coordinate(path, offset, after) {
  this.path = path;
  this.offset = offset;
  this.after = after;
  if (!isArray(path)) {
    throw new Error('Invalid arguments: path should be an array.');
  }
  if (!isNumber(offset) || offset < 0) {
    throw new Error('Invalid arguments: offset must be a positive number.');
  }
  // make sure that path can't be changed afterwards
  if (!Object.isFrozen(path)) {
    Object.freeze(path);
  }
}

Coordinate.Prototype = function() {

  this._isCoordinate = true;

  this.equals = function(other) {
    return (other === this ||
      (isEqual(other.path, this.path) && other.offset === this.offset) );
  };

  this.withCharPos = function(offset) {
    return new Coordinate(this.path, offset);
  };

  this.getNodeId = function() {
    return this.path[0];
  };

  this.getPath = function() {
    return this.path;
  };

  this.getOffset = function() {
    return this.offset;
  };

  this.toJSON = function() {
    return {
      path: this.path,
      offset: this.offset,
      after: this.after
    };
  };

  this.toString = function() {
    return "(" + this.path.join('.') + ", " + this.offset + ")";
  };

  this.isPropertyCoordinate = function() {
    return this.path.length > 1;
  };

  this.isNodeCoordinate = function() {
    return this.path.length === 1;
  };

};

oo.initClass(Coordinate);

module.exports = Coordinate;