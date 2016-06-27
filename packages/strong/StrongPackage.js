'use strict';

var Strong = require('./Strong');
var StrongTool = require('./StrongTool');
var StrongCommand = require('./StrongCommand');

module.exports = {
  name: 'strong',
  configure: function(config) {
    config.addNode(Strong);
    config.addCommand(StrongCommand);
    config.addTool(StrongTool);
    config.addIcon(StrongCommand.static.name, { 'fontawesome': 'fa-bold' });
    config.addStyle(__dirname +'/_strong.scss');
    config.addLabel('strong', {
      en: 'Strong emphasis',
      de: 'Starke Betonung'
    });
  }
};