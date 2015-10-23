'use strict';

var uuid = require('../../util/uuid');
var SurfaceCommand = require('../../ui/SurfaceCommand');

var EmbedCommand = SurfaceCommand.extend({

  static: {
    name: 'embed'
  },

  getCommandState: function() {
    var sel = this.getSelection();
    var newState = {
      disabled: true,
      active: false
    };
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false;
    }
    return newState;
  },

  execute: function(params) {
    var state = this.getCommandState();
    var surface = this.getSurface();

    // Return if command is disabled
    if (state.disabled) return;

    surface.transaction(function(tx, args) {
      var newEmbed = tx.create({
        id: uuid('embed'),
        type: 'embed',
        src: params.src,
        html: params.html
      });

      var newFigure = {
        id: uuid("image-figure"),
        type: "image-figure",
        content: newEmbed.id,
        title: "Enter title",
        caption: "Enter caption"
      };

      // Note: returning the result which will contain an updated selection
      return surface.insertNode(tx, { selection: args.selection, node: newFigure });
    });

    return {
      status: 'embed-created'
    };
  }
});

module.exports = EmbedCommand;