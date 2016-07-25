'use strict';

var ImageNode = require('./Image');
var ImageComponent = require('./ImageComponent');
var InsertImageCommand = require('./InsertImageCommand');
var InsertImageTool = require('./InsertImageTool');
var DropImage = require('./DropImage');

module.exports = {
  name: 'image',
  configure: function(config) {
    config.addNode(ImageNode);
    config.addComponent('image', ImageComponent);
    config.addCommand('insert-image', InsertImageCommand);
    config.addTool('insert-image', InsertImageTool);
    config.addIcon('insert-image', { 'fontawesome': 'fa-image' });
    config.addLabel('image', {
      en: 'Image',
      de: 'Bild'
    });
    config.addStyle(__dirname, '_image.scss');
    config.addLabel('insert-image', {
      en: 'Insert image',
      de: 'Bild einfügen'
    });
    config.addDragAndDrop(DropImage);
  }
};
