'use strict';

var Superscript = require('./Superscript');
var SuperscriptHTMLConverter = require('./SuperscriptHTMLConverter');
var SuperscriptXMLConverter = require('./SuperscriptXMLConverter');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');

module.exports = {
  name: 'superscript',
  configure: function(config) {
    config.addNode(Superscript);
    config.addConverter('html', SuperscriptHTMLConverter);
    config.addConverter('xml', SuperscriptXMLConverter);
    config.addComponent('superscript', AnnotationComponent);
    config.addCommand('superscript', AnnotationCommand, { nodeType: 'superscript' });
    config.addTool('superscript', AnnotationTool);
    config.addIcon('superscript', { 'fontawesome': 'fa-superscript' });
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    });
  }
};
