'use strict';

var Strong = require('./Strong');
var StrongHTMLConverter = require('./StrongHTMLConverter');
var StrongXMLConverter = require('./StrongXMLConverter');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');

module.exports = {
  name: 'strong',
  configure: function(config) {
    config.addNode(Strong);
    config.addConverter('html', StrongHTMLConverter);
    config.addConverter('xml', StrongXMLConverter);
    config.addComponent('strong', AnnotationComponent);
    config.addCommand('strong', AnnotationCommand, { nodeType: 'strong' });
    config.addTool('strong', AnnotationTool);
    config.addIcon('strong', { 'fontawesome': 'fa-bold' });
    config.addLabel('strong', {
      en: 'Strong emphasis',
      de: 'Starke Betonung'
    });
  }
};
