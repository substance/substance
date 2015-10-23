'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');

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
  if (!_.isArray(path)) {
    throw new Error('Invalid arguments: path should be an array.');
  }
  if (!_.isNumber(offset) || offset < 0) {
    throw new Error('Invalid arguments: offset must be a positive number.');
  }
  // make sure that path can't be changed afterwards
  if (!Object.isFrozen(path)) {
    Object.freeze(path);
  }
  Object.freeze(this);
}

Coordinate.Prototype = function() {

  this.equals = function(other) {
    return (other === this ||
      (_.isArrayEqual(other.path, this.path) && other.offset === this.offset) );
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

};

OO.initClass( Coordinate );

module.exports = Coordinate;