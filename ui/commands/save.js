'use strict';

var ControllerCommand = require('./controller_command');

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
  }
});

module.exports = Save;
