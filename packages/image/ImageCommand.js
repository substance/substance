'use strict';

var uuid = require('../../util/uuid');
var SurfaceCommand = require('../../ui/SurfaceCommand');
var DefaultDOMElement = require('../../ui/DefaultDOMElement');

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

    var surfaceEl = surface.el;
    var inputEl = DefaultDOMElement.createElement('input').attr({
      type: 'file',
      id: 'file_input',
      style: 'opacity: 0;'
    });

    surfaceEl.append(inputEl);
    inputEl.click();

    inputEl.on('change', function(/*e*/) {
      // Pick the first file
      // TODO: is there a way to use DefaultDOMElement API to access the files property?
      var file = inputEl.getProperty('files')[0];

      // We no longer need the file input
      inputEl.remove();

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