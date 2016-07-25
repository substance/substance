'use strict';

var Superscript = require('./Superscript');
var SuperscriptHTMLConverter = require('./SuperscriptHTMLConverter');
var SuperscriptXMLConverter = require('./SuperscriptXMLConverter');
var SuperscriptTool = require('./SuperscriptTool');
var SuperscriptCommand = require('./SuperscriptCommand');

module.exports = {
  name: 'superscript',
  configure: function(config) {
    config.addNode(Superscript);
    config.addConverter('html', SuperscriptHTMLConverter);
    config.addConverter('xml', SuperscriptXMLConverter);
    config.addCommand(SuperscriptCommand);
    config.addTool(SuperscriptTool);
    config.addStyle(__dirname, '_superscript.scss');
    config.addIcon(SuperscriptCommand.static.name, { 'fontawesome': 'fa-superscript' });
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    });
  }
};
