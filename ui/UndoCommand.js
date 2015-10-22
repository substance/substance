'use strict';

var ControllerCommand = require('./ControllerCommand');

var Undo = ControllerCommand.extend({
  static: {
    name: 'undo'
  },

  getCommandState: function() {
    var doc = this.getDocument();
    return {
      disabled: doc.done.length === 0,
      active: false
    };
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