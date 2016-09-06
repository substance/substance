'use strict';

var ImageNode = require('./Image');
var ImageComponent = require('./ImageComponent');
var ImageHTMLConverter = require('./ImageHTMLConverter');
var ImageXMLConverter = require('./ImageXMLConverter');
var InsertImageCommand = require('./InsertImageCommand');
var InsertImageTool = require('./InsertImageTool');
var DropImage = require('./DropImage');

module.exports = {
  name: 'image',
  configure: function(config) {
    config.addNode(ImageNode);
    config.addComponent('image', ImageComponent);
    config.addConverter('html', ImageHTMLConverter);
    config.addConverter('xml', ImageXMLConverter);
    config.addCommand('insert-image', InsertImageCommand);
    config.addTool('insert-image', InsertImageTool);
    config.addIcon('insert-image', { 'fontawesome': 'fa-image' });
    config.addLabel('image', {
      en: 'Image',
      de: 'Bild'
    });
    config.addLabel('insert-image', {
      en: 'Insert image',
      de: 'Bild einfügen'
    });
    config.addDragAndDrop(DropImage);
  }
};
