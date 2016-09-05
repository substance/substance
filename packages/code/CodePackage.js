'use strict';

var Code = require('./Code');
var CodeHTMLConverter = require('./CodeHTMLConverter');
var CodeXMLConverter = require('./CodeXMLConverter');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationTool = require('../../ui/AnnotationTool');

module.exports = {
  name: 'code',
  configure: function(config) {
    config.addNode(Code);
    config.addConverter('html', CodeHTMLConverter);
    config.addConverter('xml', CodeXMLConverter);
    config.addComponent('code', AnnotationComponent);
    config.addCommand('code', AnnotationCommand, { nodeType: Code.type });
    config.addTool('code', AnnotationTool);
    config.addIcon('code', { 'fontawesome': 'fa-code' });
    config.addLabel('code', {
      en: 'Code',
      de: 'Code'
    });
  }
};
