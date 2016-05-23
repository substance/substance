'use strict';

var Paragraph = require('./Paragraph');
var ParagraphComponent = require('./ParagraphComponent');
var ParagraphHTMLConverter = require('./ParagraphHTMLConverter');

module.exports = function(config) {
  config.addNode(Paragraph);
  config.addComponent('paragraph', ParagraphComponent);
  config.addConverter(ParagraphHTMLConverter);
  config.addTextType({
    name: 'paragraph',
    data: {type: 'paragraph'}
  });
};