'use strict';

var Blockquote = require('./Blockquote');
var BlockquoteComponent = require('./BlockquoteComponent');
var BlockquoteHTMLConverter = require('./BlockquoteHTMLConverter');
var path = require('path');

module.exports = {
  name: 'blockquote',
  configure: function(config) {
    config.addNode(Blockquote);
    config.addComponent(Blockquote.static.name, BlockquoteComponent);
    config.addConverter('html', BlockquoteHTMLConverter);
    config.addStyle(path.join(__dirname, '_blockquote.scss'));
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