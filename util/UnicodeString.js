'use strict';

var oo = require('./oo');

var graphemebreak = require('./unicodejs/graphemebreak');

function UnicodeString(text) {
  if (text instanceof UnicodeString) {
    this.clusters = text.clusters.slice(0);
  } else {
    this.clusters = graphemebreak.splitClusters(text);
  }
}

UnicodeString.Prototype = function() {

  this.read = function (position) {
    var clusterAt = this.clusters[position];
    return clusterAt !== undefined ? clusterAt : null;
  };

  this.getLength = function () {
    return this.clusters.length;
  };

  this.substring = function (start, end) {
    var textString = new UnicodeString('');
    textString.clusters = this.clusters.slice(start, end);
    return textString;
  };

  this.getString = function () {
    return this.clusters.join('');
  };

  this.toString = function () {
    return this.getString();
  };

  this.toJSON = function() {
    return this.getString();
  };

  this.concat = function(other) {
    var result = new UnicodeString('');
    if (! (other instanceof UnicodeString) ){
      other = new UnicodeString(other);
    }
    result.clusters = this.clusters.concat(other.clusters);
    return result;
  };

  this.splice = function(offset, ndeletes, data) {
    var args = [offset, ndeletes];
    if (data) args = args.concat(data);
    this.clusters.splice.apply(this.clusters, args);
  };

  this.slice = function(start, end) {
    var result = new UnicodeString('');
    result.clusters = this.clusters.slice(start, end);
    return result;
  };

  this.clone = function() {
    var result = new UnicodeString('');
    result.clusters = this.clusters.slice(0);
    return result;
  };

};

oo.initClass(UnicodeString);

Object.defineProperties(UnicodeString.prototype, {
  'length': {
    get: function() {
      return this.clusters.length;
    }
  }
});

module.exports = UnicodeString;
