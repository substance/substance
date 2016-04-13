'use strict';

var uuid = require('../../util/uuid');
var SurfaceCommand = require('../../ui/SurfaceCommand');
var DefaultDOMElement = require('../../ui/DefaultDOMElement');

var InsertFigureCommand = SurfaceCommand.extend({

  static: {
    name: 'insertFigure'
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

  execute: function() {
    var state = this.getCommandState();
    var surface = this.getSurface();

    // WriterController interface, we use it for file upload
    var controller = surface.getController();

    // Return if command is disabled
    if (state.disabled) return;

    var surfaceEl = surface.el;
    var inputEl = DefaultDOMElement.parseHTML('<input type="file" id="file_input" style="opacity: 0;">');
    surfaceEl.appendChild(inputEl);
    inputEl.click();

    inputEl.on('change', function() {
      var files = inputEl.getProperty('files');
      var file = files[0];

      // We no longer need the file input
      inputEl.remove();

      controller.uploadFile(file, function(err, figureUrl) {
        // NOTE: we are providing a custom beforeState, to make sure
        // thate the correct initial selection is used.

        // var beforeState = { selection: surface.getSelection() };
        surface.transaction(function(tx, args) {
          var newImage = tx.create({
            id: uuid("image"),
            type: "image",
            src: figureUrl,
            previewSrc: figureUrl,
          });

          var newFigure = {
            id: uuid("image-figure"),
            type: "image-figure",
            content: newImage.id,
            title: "Enter title",
            caption: "Enter caption"
          };

          // Note: returning the result which will contain an updated selection
          return surface.insertNode(tx, { selection: args.selection, node: newFigure });
        });
      });
    }.bind(this));

    return {
      status: 'file-upload-process-started'
    };
  }
});

module.exports = InsertFigureCommand;