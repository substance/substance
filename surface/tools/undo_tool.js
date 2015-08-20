var Tool = require('../tool');

var UndoTool = Tool.extend({

  name: "undo",

  update: function(surface) {
    this.surface = surface;
    var doc = surface.getDocument();
    if (!surface.isEnabled() || doc.done.length===0) {
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