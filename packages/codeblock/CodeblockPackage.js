'use strict';

var Codeblock = require('./Codeblock');
var CodeblockComponent = require('./CodeblockComponent');
var CodeblockHTMLConverter = require('./CodeblockHTMLConverter');

module.exports = {
  name: 'codeblock',
  configure: function(config) {
    config.addNode(Codeblock);
    config.addComponent(Codeblock.static.name, CodeblockComponent);
    config.addConverter('html', CodeblockHTMLConverter);
    config.addTextType({
      name: 'codeblock',
      data: {type: 'codeblock'}
    });
    config.addStyle(__dirname, '_codeblock.scss');
    config.addLabel('codeblock', {
      en: 'Codeblock',
      de: 'Codeblock'
    });
  }
};