'use strict';

var Code = require('./Code');
var CodeHTMLConverter = require('./CodeHTMLConverter');
var CodeXMLConverter = require('./CodeXMLConverter');
var CodeTool = require('./CodeTool');
var CodeCommand = require('./CodeCommand');

module.exports = {
  name: 'code',
  configure: function(config) {
    config.addNode(Code);
    config.addConverter('html', CodeHTMLConverter);
    config.addConverter('xml', CodeXMLConverter);
    config.addCommand(CodeCommand);
    config.addTool(CodeTool);
    config.addIcon('code', { 'fontawesome': 'fa-code' });
    config.addStyle(__dirname, '_code.scss');
    config.addLabel('code', {
      en: 'Code',
      de: 'Code'
    });
  }
};
