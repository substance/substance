'use strict';
var lastTime = Date.now();

module.exports = {
  tic: function() {
    lastTime = Date.now();
  },
  toc: function () {
    return Date.now() - lastTime;
  },
};
