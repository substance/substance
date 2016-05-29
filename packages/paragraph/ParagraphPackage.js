'use strict';

var Paragraph = require('./Paragraph');
var ParagraphComponent = require('./ParagraphComponent');
var ParagraphHTMLConverter = require('./ParagraphHTMLConverter');

module.exports = {
  name: 'paragraph',
  configure: function(config) {
    config.addNode(Paragraph);
    config.addComponent(Paragraph.static.name, ParagraphComponent);
    config.addConverter('html', ParagraphHTMLConverter);
    config.addTextType({
      name: 'paragraph',
      data: {type: 'paragraph'}
    });
  }
};