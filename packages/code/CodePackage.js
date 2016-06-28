'use strict';

var Code = require('./Code');
var CodeTool = require('./CodeTool');
var CodeCommand = require('./CodeCommand');
var path = require('path');

module.exports = {
  name: 'code',
  configure: function(config) {
    config.addNode(Code);
    config.addCommand(CodeCommand);
    config.addTool(CodeTool);
    config.addIcon('code', { 'fontawesome': 'fa-code' });
    config.addStyle(path.join(__dirname, '_code.scss'));
    config.addLabel('code', {
      en: 'Code',
      de: 'Code'
    });
  }
};
