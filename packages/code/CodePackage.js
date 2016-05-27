'use strict';

var Code = require('./Code');
var CodeTool = require('./CodeTool');
var CodeCommand = require('./CodeCommand');

module.exports = {
  name: 'code',
  configure: function(config) {
    config.addNode(Code);
    config.addCommand(CodeCommand);
    config.addTool(CodeTool);
  }
};

