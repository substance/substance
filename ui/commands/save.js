'use strict';

var Command = require('./command');

var Save = Command.extend({
  static: {
    name: 'save'
  },

  execute: function() {
    this.getController().saveDocument();
  }
});

module.exports = Save;
