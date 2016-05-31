'use strict';

var breakList = require('./breakList');

module.exports = {

  register: function(behavior) {
    behavior
      .defineBreak('list-item', breakList);
  }

};
