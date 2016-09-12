'use strict';

import oo from '../../util/oo'

var SaveHandlerStub = function() {
};

SaveHandlerStub.Prototype = function() {
  this.saveDocument = function(doc, changes, cb) {
    console.warn('No SaveHandler provided. Using Stub.');
    cb(null);
  };
};

oo.initClass(SaveHandlerStub);

export default SaveHandlerStub;