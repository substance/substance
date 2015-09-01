'use strict';

var DocumentTool = require('./document_tool');

var UndoTool = DocumentTool.extend({

  name: "undo",

  update: function(change, info) {
    var doc = this.getDocument();
    if (doc.done.length===0) {
      this.setDisabled();
    } else {
      this.setEnabled();
    }
  },

  performAction: function() {
    var doc = this.getDocument();
    if (this.isEnabled() && doc.done.length>0) {
      doc.undo();
    }
  }
});

module.exports = UndoTool;
