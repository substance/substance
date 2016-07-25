'use strict';

var Superscript = require('./Superscript');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');
var SuperscriptHTMLConverter = require('./SuperscriptHTMLConverter');
var SuperscriptXMLConverter = require('./SuperscriptXMLConverter');


module.exports = {
  name: 'superscript',
  configure: function(config) {
    config.addNode(Superscript);
    config.addComponent('superscript', AnnotationComponent);
    config.addCommand('superscript', AnnotationCommand, { nodeType: 'superscript' });
    config.addTool('superscript', AnnotationTool);
    config.addConverter('html', SuperscriptHTMLConverter);
    config.addConverter('xml', SuperscriptXMLConverter);
    config.addStyle(__dirname, '_superscript.scss');
    config.addIcon('superscript', { 'fontawesome': 'fa-superscript' });
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    });
  }
};
