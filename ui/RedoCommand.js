'use strict';

var ControllerCommand = require('./ControllerCommand');

var Redo = ControllerCommand.extend({
  static: {
    name: 'redo'
  },

  getCommandState: function() {
    var doc = this.getDocument();

    return {
      disabled: doc.undone.length === 0,
      active: false
    };
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
