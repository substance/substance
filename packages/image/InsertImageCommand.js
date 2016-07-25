'use strict';

var Command = require('../../ui/Command');
var paste = require('../../model/transform/paste');

function ImageCommand() {
  ImageCommand.super.call(this, { name: 'insert-image' });
}

ImageCommand.Prototype = function() {

  this.getCommandState = function(props, context) {
    var documentSession = context.documentSession;
    var sel = props.selection || documentSession.getSelection();
    var surface = props.surface || context.surfaceManager.getFocusedSurface();
    var newState = {
      disabled: true,
      active: false
    };
    if (sel && !sel.isNull() && !sel.isCustomSelection() &&
        surface && surface.isContainerEditor()) {
      newState.disabled = false;
    }
    return newState;
  };

  /**
    Inserts (stub) images and triggers a fileupload.
    After upload has completed, the image URLs get updated.
  */
  this.execute = function(props, context) {
    var state = this.getCommandState(props, context);
    // Return if command is disabled
    if (state.disabled) return;

    var documentSession = context.documentSession;
    var sel = props.selection || documentSession.getSelection();
    var surface = props.surface || context.surfaceManager.getFocusedSurface();
    var fileClient = context.fileClient;
    var files = props.files;

    // can drop images only into container editors
    if (!surface.isContainerEditor()) return;

    // creating a small doc where we add the images
    // and then we use the paste transformation to get this snippet
    // into the real doc
    var doc = surface.getDocument();
    var snippet = doc.createSnippet();

    // as file upload takes longer we will insert stub images
    var items = files.map(function(file) {
      var node = snippet.create({ type: 'image' });
      snippet.show(node);
      return {
        file: file,
        nodeId: node.id
      };
    });

    surface.transaction(function(tx) {
      tx.before.selection = sel;
      return paste(tx, {
        selection: sel,
        containerId: surface.getContainerId(),
        doc: snippet
      });
    });

    // start uploading
    items.forEach(function(item) {
      var nodeId = item.nodeId;
      var file = item.file;
      var node = doc.get(nodeId);
      node.emit('upload:started');
      var channel = fileClient.uploadFile(file, function(err, url) {
        if (err) {
          url = "error";
        }
        // get the node again to make sure it still exists
        var node = doc.get(nodeId);
        if (node) {
          node.emit('upload:finished');
          documentSession.transaction(function(tx) {
            tx.set([nodeId, 'src'], url);
          });
        }
      });
      channel.on('progress', function(progress) {
        // console.log('Progress', progress);
        node.emit('upload:progress', progress);
      });
    });

    return {
      status: 'file-upload-process-started'
    };
  };

};

Command.extend(ImageCommand);

module.exports = ImageCommand;
