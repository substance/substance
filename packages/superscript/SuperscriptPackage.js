'use strict';

var Superscript = require('./Superscript');
var SuperscriptTool = require('./SuperscriptTool');
var SuperscriptCommand = require('./SuperscriptCommand');
var path = require('path');

module.exports = {
  name: 'superscript',
  configure: function(config) {
    config.addNode(Superscript);
    config.addCommand(SuperscriptCommand);
    config.addTool(SuperscriptTool);
    config.addStyle(path.join(__dirname, '_superscript.scss'));
    config.addIcon(SuperscriptCommand.static.name, { 'fontawesome': 'fa-superscript' });
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    });
  }
};

