'use strict';

var ControllerCommand = require('./controller_command');

var Save = ControllerCommand.extend({
  static: {
    name: 'save'
  },

  execute: function() {
    this.getController().saveDocument();
  }
});

module.exports = Save;
