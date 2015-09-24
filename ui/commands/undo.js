'use strict';

var Command = require('./command');

var Undo = Command.extend({
  static: {
    name: 'undo'
  },

  execute: function() {
    var doc = this.getDocument();
    if (doc.done.length>0) {
      doc.undo();
      return true;
    }
    return false;
  }
});

module.exports = Undo;