'use strict';

var Emphasis = require('./Emphasis');
var EmphasisHTMLConverter = require('./EmphasisHTMLConverter');
var EmphasisXMLConverter = require('./EmphasisXMLConverter');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');

module.exports = {
  name: 'emphasis',
  configure: function(config) {
    config.addNode(Emphasis);
    config.addConverter('html', EmphasisHTMLConverter);
    config.addConverter('xml', EmphasisXMLConverter);
    config.addComponent('emphasis', AnnotationComponent);
    config.addCommand('emphasis', AnnotationCommand, { nodeType: Emphasis.type });
    config.addTool('emphasis', AnnotationTool);
    config.addIcon('emphasis', { 'fontawesome': 'fa-italic' });
    config.addLabel('emphasis', {
      en: 'Emphasis',
      de: 'Betonung'
    });
  }
};

