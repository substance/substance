'use strict';

var Emphasis = require('./Emphasis');
var EmphasisTool = require('./EmphasisTool');
var EmphasisCommand = require('./EmphasisCommand');

module.exports = function(config, options) {
  config.addNode(Emphasis);
  config.addCommand(EmphasisCommand);
  config.addTool(EmphasisTool, {
    icon: options.icon || 'fa-italic'
  });
};