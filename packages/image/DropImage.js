'use strict';

var startsWith = require('lodash/startsWith');
var DragAndDropHandler = require('../../ui/DragAndDropHandler');
var InsertImageCommand = require('./InsertImageCommand');

function DropImage() {}

DropImage.Prototype = function() {

  this.drop = function(props, context) {
    // precondition: we need a surface and a selection
    // and act only if there are image files
    var surface = props.surface;
    var selection = props.selection;
    var files = props.files;
    if (!surface || !selection || !files || files.length === 0) return;
    // pick only the images
    files = files.filter(function(file) {
      return startsWith(file.type, 'image');
    });
    if (files.length === 0) return;
    context.commandManager.executeCommand(InsertImageCommand.static.name, props);
  };

};

DragAndDropHandler.extend(DropImage);

module.exports = DropImage;
