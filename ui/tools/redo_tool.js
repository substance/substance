'use strict';

var DocumentTool = require('./document_tool');

var UndoTool = DocumentTool.extend({
  name: "redo",

  update: function(surface) {
    this.surface = surface;
    var doc = this.getDocument();
    if (doc.undone.length===0) {
      this.setDisabled();
    } else {
      this.setEnabled();
    }
  },

  performAction: function() {
    var doc = this.getDocument();
    if (this.isEnabled() && doc.undone.length>0) {
      doc.redo();
    }
  }
});

module.exports = UndoTool;
