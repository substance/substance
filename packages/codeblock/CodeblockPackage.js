'use strict';

var Codeblock = require('./Codeblock');
var CodeblockComponent = require('./CodeblockComponent');
var CodeblockHTMLConverter = require('./CodeblockHTMLConverter');

module.exports = function(config) {
  config.addNode(Codeblock);
  config.addComponent('codeblock', CodeblockComponent);
  config.addConverter(CodeblockHTMLConverter);
  config.addTextType({
    name: 'codeblock',
    data: {type: 'codeblock'}
  });
};