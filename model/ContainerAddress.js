'use strict';

var oo = require('../util/oo');

function ContainerAddress(pos, offset) {
  this.pos = pos;
  this.offset = offset;
}

ContainerAddress.Prototype = function() {

  this.isBefore = function(other, strict) {
    strict = !!strict;
    if (this.pos < other.pos) {
      return true;
    } else if (this.pos > other.pos) {
      return false;
    } else if (this.offset < other.offset) {
      return true;
    } else if (this.offset > other.offset) {
      return false;
    }
    if (strict) {
      return false;
    } else {
      return true;
    }
  };

  this.isAfter = function(other, strict) {
    return other.isBefore(this, strict);
  };

  this.isEqual = function(other) {
    return (this.pos === other.pos && this.offset === other.offset);
  };

  this.toString = function() {
    return [this.pos,'.',this.offset].join('');
  };
};

oo.initClass(ContainerAddress);

module.exports = ContainerAddress;
