'use strict';

var ControllerCommand = require('./ControllerCommand');

var Save = ControllerCommand.extend({
  static: {
    name: 'save'
  },

  getCommandState: function() {
    var doc = this.getDocument();
    return {
      disabled: !doc.__dirty,
      active: false
    };
  },

  execute: function() {
    this.getController().saveDocument();
    return {
      status: 'saving-process-started'
    };
  }
});

module.exports = Save;
