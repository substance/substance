'use strict';

var ImageNode = require('./Image');
var ImageComponent = require('./ImageComponent');
var InsertImageCommand = require('./InsertImageCommand');
var InsertImageTool = require('./InsertImageTool');

module.exports = {
  name: 'image',
  configure: function(config) {
    config.addNode(ImageNode);
    config.addComponent(ImageNode.static.name, ImageComponent);
    config.addCommand(InsertImageCommand);
    config.addTool(InsertImageTool);
    config.addIcon(InsertImageCommand.static.name, { 'fontawesome': 'fa-image' });
    config.addLabel('image', {
      en: 'Image',
      de: 'Bild'
    });
  }
};
