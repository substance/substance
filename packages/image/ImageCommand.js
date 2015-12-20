'use strict';

var uuid = require('../../util/uuid');
var SurfaceCommand = require('../../ui/SurfaceCommand');
var $ = require('../../util/jquery');

var ImageCommand = SurfaceCommand.extend({

  static: {
    name: 'image'
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

  /**
    Initiates a fileupload and performs image insertion after the fileupload
    has been completed.

    TODO: Think about ways to make ImagCommand CLI-compatible.
  */
  execute: function() {
    var state = this.getCommandState();
    var surface = this.getSurface();

    // WriterController interface, we use it for file upload
    var controller = surface.getController();

    // Return if command is disabled
    if (state.disabled) return;

    var $surface = surface.$el;
    var $inputEl = $('<input type="file" id="file_input" style="opacity: 0;">');
    $surface.append($inputEl);
    $inputEl.click();

    $inputEl.on('change', function(/*e*/) {
      var file = $inputEl[0].files[0];

      // We no longer need the file input
      $inputEl.remove();

      controller.uploadFile(file, function(err, figureUrl) {
        // NOTE: we are providing a custom beforeState, to make sure
        // thate the correct initial selection is used.
        surface.transaction(function(tx, args) {

          var newImage = {
            id: uuid('image'),
            type: 'image',
            src: figureUrl,
            previewSrc: figureUrl
          };

          // Note: returning the result which will contain an updated selection
          return surface.insertNode(tx, { selection: args.selection, node: newImage });
        });
      });
    }.bind(this));

    return {
      status: 'file-upload-process-started'
    };
  }
});

module.exports = ImageCommand;