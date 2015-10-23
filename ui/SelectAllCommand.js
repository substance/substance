'use strict';

var SurfaceCommand = require('./SurfaceCommand');

var SelectAll = SurfaceCommand.extend({
  static: {
    name: 'selectAll'
  },

  execute: function() {
    var surface = this.getSurface();
    if (surface) {
      var newSelection = surface.selectAll(surface.getDocument(), surface.getSelection());
      surface.setSelection(newSelection);
      return true;
    } else {
      console.warn('selectAll command can not be applied since there is no focused surface');
      return false;
    }
  }
});

module.exports = SelectAll;