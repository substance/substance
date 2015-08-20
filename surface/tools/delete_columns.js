'use strict';

var Tool = require('../tool');

var DeleteColumnsTool = Tool.extend({

  name: "delete_columns",

  update: function(surface, sel) {
    this.surface = surface; // IMPORTANT!
    // Set disabled when not a property selection
    if (!surface.isEnabled() || sel.isNull() || !sel.isTableSelection()) {
      return this.setDisabled();
    }
    this.setToolState({
      surface: surface,
      sel: sel,
      disabled: false
    });
  },

  performAction: function(options) {
    this.surface.transaction(function(tx, args) {
      console.log('TODO: delete columns', options);
      return args;
    });
  },

});

module.exports = DeleteColumnsTool;
