'use strict';

var Blockquote = require('./Blockquote');
var BlockquoteComponent = require('./BlockquoteComponent');
var BlockquoteHTMLConverter = require('./BlockquoteHTMLConverter');
var BlockquoteXMLConverter = require('./BlockquoteXMLConverter');

module.exports = {
  name: 'blockquote',
  configure: function(config) {
    config.addNode(Blockquote);
    config.addComponent(Blockquote.type, BlockquoteComponent);
    config.addConverter('html', BlockquoteHTMLConverter);
    config.addConverter('xml', BlockquoteXMLConverter);
    config.addStyle(__dirname, '_blockquote.scss');
    config.addTextType({
      name: 'blockquote',
      data: {type: 'blockquote'}
    });
    config.addLabel('blockquote', {
      en: 'Blockquote',
      de: 'Blockzitat'
    });
  }
};