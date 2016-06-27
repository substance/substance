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
    config.addStyle(__dirname +'/_paragraph.scss');
    config.addLabel('paragraph', {
      en: 'Paragraph',
      de: 'Paragraph'
    });
    config.addLabel('paragraph.content', {
      en: 'Paragraph',
      de: 'Paragraph'
    });
  }
};