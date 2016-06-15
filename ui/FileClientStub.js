'use strict';

var oo = require('../util/oo');

var FileClientStub = function() {
};

FileClientStub.Prototype = function() {
  this.uploadFile = function(file, cb) {
    // Default file upload implementation
    // We just return a temporary objectUrl
    var fileUrl = window.URL.createObjectURL(file);
    cb(null, fileUrl);
  };
};

oo.initClass(FileClientStub);

module.exports = FileClientStub;