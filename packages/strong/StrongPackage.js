'use strict';

var Strong = require('./Strong');
var StrongTool = require('./StrongTool');
var StrongCommand = require('./StrongCommand');
var StrongHTMLConverter = require('./StrongHTMLConverter');
var StrongXMLConverter = require('./StrongXMLConverter');

module.exports = {
  name: 'strong',
  configure: function(config) {
    config.addNode(Strong);
    config.addConverter('html', StrongHTMLConverter);
    config.addConverter('xml', StrongXMLConverter);
    config.addCommand(StrongCommand);
    config.addTool(StrongTool);
    config.addIcon(StrongCommand.static.name, { 'fontawesome': 'fa-bold' });
    config.addStyle(__dirname, '_strong.scss');
    config.addLabel('strong', {
      en: 'Strong emphasis',
      de: 'Starke Betonung'
    });
  }
};