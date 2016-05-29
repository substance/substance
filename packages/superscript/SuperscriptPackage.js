'use strict';

var Superscript = require('./Superscript');
var SuperscriptTool = require('./SuperscriptTool');
var SuperscriptCommand = require('./SuperscriptCommand');

module.exports = {
  name: 'superscript',
  configure: function(config) {
    config.addNode(Superscript);
    config.addCommand(SuperscriptCommand);
    config.addTool(SuperscriptTool);
    config.addIcon(SuperscriptCommand.static.name, { 'fontawesome': 'fa-superscript' });
  }
};

