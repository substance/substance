'use strict';

var Tool = require('../tool');

var InsertColumnsTool = Tool.extend({

  name: "insert_columns",

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
      console.log('TODO: insert columns', options);
      return args;
    });
  },

});

module.exports = InsertColumnsTool;
