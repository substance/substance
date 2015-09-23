'use strict';

var DocumentTool = require('./document_tool');

var UndoTool = DocumentTool.extend({

  static: {
    name: 'undo',
    command: 'undo'
  },

  update: function(change, info) {
    /* jshint unused:false */
    var doc = this.getDocument();
    if (doc.done.length===0) {
      this.setDisabled();
    } else {
      this.setEnabled();
    }
  }
});

module.exports = UndoTool;
