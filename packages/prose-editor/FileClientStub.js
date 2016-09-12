'use strict';

import oo from '../../util/oo'
import EventEmitter from '../../util/EventEmitter'

var FileClientStub = function() {};

FileClientStub.Prototype = function() {

  this.uploadFile = function(file, cb) {
    var delay = 50;
    var steps = (file.size / 500000) * (1000 / delay);
    var i = 0;
    var channel = new EventEmitter();
    var _step = function() {
      if (i++ < steps) {
        channel.emit('progress', (i-1)/(steps));
        window.setTimeout(_step, delay);
      } else {
        // Default file upload implementation
        // We just return a temporary objectUrl
        var fileUrl = window.URL.createObjectURL(file);
        cb(null, fileUrl);
      }
    };
    _step();
    return channel;
  };
};

oo.initClass(FileClientStub);

export default FileClientStub;