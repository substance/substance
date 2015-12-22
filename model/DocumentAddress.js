"use strict";

function DocumentAddress() {
  Array.apply(this);
  if (arguments.length > 0) {
    this._pushVals(arguments);
  }
}

DocumentAddress.Prototype = function() {
  this.isBefore = function(other) {
    if (this.length === 0) {
      return false;
    }
    if (other.length === 0) {
      return false;
    }
    var aIsShorter = (this.length < other.length);
    for (var idx = 0;; idx++) {
      var a = this[idx];
      var b = other[idx];
      if (a === undefined) {
        if (aIsShorter) {
          return true;
        } else {
          return false;
        }
      }
      if (b === undefined) {
        return false;
      }
      if (a === b) continue;
      return (a < b);
    }
  };
  this.isAfter = function(other) {
    return other.isBefore(this);
  };
  this.isEqual = function(other) {
    return DocumentAddress.equal(this, other);
  };
  this.equals = this.isEqual;
  this.append = function(other) {
    return this._pushVals(other);
  };
  this.clone = function() {
    return new DocumentAddress().append(this);
  };
  this.slice = function() {
    return new DocumentAddress()._pushVals(Array.prototype.slice.apply(this, arguments));
  };
  this.push = function() {
    Array.prototype.push.apply(this, arguments);
    return this;
  };
  this._pushVals = function(arr) {
    Array.prototype.push.apply(this, arr);
    return this;
  };
};
DocumentAddress.Prototype.prototype = Array.prototype;
DocumentAddress.prototype = new DocumentAddress.Prototype();
DocumentAddress.prototype.constructor = DocumentAddress;


DocumentAddress.equal = function(a, b) {
  var len = a.length;
  if (len !== b.length) return false;
  for (var idx = 0; idx < len; idx++) {
    if (a[idx] !== b[idx]) {
      return false;
    }
  }
  return true;
};

module.exports = DocumentAddress;
