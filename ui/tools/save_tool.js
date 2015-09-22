'use strict';

var DocumentTool = require('./document_tool');
var SaveTool = DocumentTool.extend({

  static: {
    name: 'save',
    command: 'save'
  },

  didInitialize: function() {
    var ctrl = this.getController();
    ctrl.connect(this, {
      'document:saved': this.update
    });
  },

  update: function(change, info) {
    /* jshint unused:false */
    var doc = this.getDocument();
    if (doc.__dirty) {
      this.setEnabled();
    } else {
      this.setDisabled();
    }
  }
});

module.exports = SaveTool;
