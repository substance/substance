'use strict';

var oo = require('../util/oo');
var warn = require('../util/warn');

var SaveHandlerStub = function() {
};

SaveHandlerStub.Prototype = function() {
  this.saveDocument = function(doc, changes, cb) {
    warn('No SaveHandler provided. Using Stub.');
    cb(null);
  };
};

oo.initClass(SaveHandlerStub);

module.exports = SaveHandlerStub;