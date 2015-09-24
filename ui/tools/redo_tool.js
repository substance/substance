'use strict';

var DocumentTool = require('./document_tool');

var RedoTool = DocumentTool.extend({
  static: {
    name: 'redo',
    command: 'redo'  
  },

  update: function() {
    var doc = this.getDocument();
    if (doc.undone.length===0) {
      this.setDisabled();
    } else {
      this.setEnabled();
    }
  }
});

module.exports = RedoTool;
