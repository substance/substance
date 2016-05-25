'use strict';

var oo = require('../util/oo');

var StubFileUploader = function() {
};

StubFileUploader.Prototype = function() {
  this.uploadFile = function(file, cb) {
    // Default file upload implementation
    // We just return a temporary objectUrl
    var fileUrl = window.URL.createObjectURL(file);
    cb(null, fileUrl);
  };
};

oo.initClass(StubFileUploader);

module.exports = StubFileUploader;