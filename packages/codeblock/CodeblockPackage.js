'use strict';

var Codeblock = require('./Codeblock');
var CodeblockComponent = require('./CodeblockComponent');
var CodeblockHTMLConverter = require('./CodeblockHTMLConverter');
var CodeblockXMLConverter = require('./CodeblockXMLConverter');

module.exports = {
  name: 'codeblock',
  configure: function(config) {
    config.addNode(Codeblock);
    config.addComponent('codeblock', CodeblockComponent);
    config.addConverter('html', CodeblockHTMLConverter);
    config.addConverter('xml', CodeblockXMLConverter);
    config.addTextType({
      name: 'codeblock',
      data: {type: 'codeblock'}
    });
    config.addLabel('codeblock', {
      en: 'Codeblock',
      de: 'Codeblock'
    });
  }
};