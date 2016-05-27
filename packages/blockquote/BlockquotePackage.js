'use strict';

var Blockquote = require('./Blockquote');
var BlockquoteComponent = require('./BlockquoteComponent');
var BlockquoteHTMLConverter = require('./BlockquoteHTMLConverter');

module.exports = {
  name: 'blockquote',
  configure: function(config) {
    config.addNode(Blockquote);
    config.addComponent('blockquote', BlockquoteComponent);
    config.addConverter(BlockquoteHTMLConverter);
    config.addTextType({
      name: 'blockquote',
      data: {type: 'blockquote'}
    });
  }
};