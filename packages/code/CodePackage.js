'use strict';

var Code = require('./Code');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationTool = require('../../ui/AnnotationTool');

module.exports = {
  name: 'code',
  configure: function(config) {
    config.addNode(Code);
    config.addComponent('code', AnnotationComponent);
    config.addCommand('code', AnnotationCommand, { nodeType: Code.type });
    config.addTool('code', AnnotationTool);
    config.addIcon('code', { 'fontawesome': 'fa-code' });
    config.addStyle(__dirname, '_code.scss');
    config.addLabel('code', {
      en: 'Code',
      de: 'Code'
    });
  }
};
