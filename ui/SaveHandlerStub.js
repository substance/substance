'use strict';

var oo = require('../util/oo');

var SaveHandlerStub = function() {
};

SaveHandlerStub.Prototype = function() {
  this.saveDocument = function(doc, changes, cb) {
    console.warn('No SaveHandler provided. Using Stub.');
    cb(null);
  };
};

oo.initClass(SaveHandlerStub);

module.exports = SaveHandlerStub;