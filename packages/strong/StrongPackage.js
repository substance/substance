'use strict';

var Strong = require('./Strong');
var StrongTool = require('./StrongTool');
var StrongCommand = require('./StrongCommand');

module.exports = {
  name: 'strong',
  configure: function(config, options) {
    config.addNode(Strong);
    config.addCommand(StrongCommand);
    config.addTool(StrongTool);
  }
};