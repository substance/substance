var Tool = require('../tool');

var RedoTool = Tool.extend({

  name: "redo",

  update: function(surface) {
    this.surface = surface;
    var doc = surface.getDocument();
    if (!surface.isEnabled() || doc.undone.length===0) {
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

module.exports = RedoTool;
