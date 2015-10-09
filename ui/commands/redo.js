'use strict';

var Command = require('./controller_command');

var Redo = Command.extend({
  static: {
    name: 'redo'
  },

  execute: function() {
    var doc = this.getDocument();
    if (doc.undone.length>0) {
      doc.redo();
      return true;
    } else {
      return false;
    }
  }
});

module.exports = Redo;
