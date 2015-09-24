'use strict';

var Command = require('./command');

var SelectAll = Command.extend({
  static: {
    name: 'selectAll'
  },

  execute: function() {
    var ctrl = this.getController();
    var surface = ctrl.getSurface();
    if (surface) {
      var editor = ctrl.getSurface().getEditor();
      var newSelection = editor.selectAll(ctrl.getDocument(), surface.getSelection());
      surface.setSelection(newSelection);
      return true;
    } else {
      console.warn('selectAll command can not be applied since there is no focused surface');
      return false;
    }
  }
});

module.exports = SelectAll;