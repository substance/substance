'use strict';

var uuid = require('../../util/uuid');
var Command = require('../../ui/Command');

function ImageCommand() {
  ImageCommand.super.apply(this, arguments);
}

ImageCommand.Prototype = function() {

  this.getCommandState = function(props, context) {
    var documentSession = context.documentSession;
    var sel = documentSession.getSelection();

    var newState = {
      disabled: true,
      active: false
    };
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false;
    }
    return newState;
  };

  /**
    Initiates a fileupload and performs image insertion after the fileupload
    has been completed.

    TODO: Think about ways to make ImagCommand CLI-compatible.
  */
  this.execute = function(props, context) {
    var state = this.getCommandState(props, context);
    // Return if command is disabled
    if (state.disabled) return;

    var surface = context.surfaceManager.getFocusedSurface();
    var fileClient = context.fileClient;
    var file = props.file;
    if (!file) {
      throw new Error("'file' is mandatory.");
    }
    fileClient.uploadFile(file, function(err, figureUrl) {
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
        return surface.insertNode(tx, {
          selection: args.selection,
          node: newImage,
          containerId: surface.getContainerId()
        });
      });
    });

    return {
      status: 'file-upload-process-started'
    };
  };

};

Command.extend(ImageCommand);

ImageCommand.static.name = 'insert-image';

module.exports = ImageCommand;
