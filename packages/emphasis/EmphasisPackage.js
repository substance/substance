'use strict';

var Emphasis = require('./Emphasis');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');
var EmphasisHTMLConverter = require('./EmphasisHTMLConverter');
var EmphasisXMLConverter = require('./EmphasisXMLConverter');

module.exports = {
  name: 'emphasis',
  configure: function(config) {
    config.addNode(Emphasis);
    config.addComponent('emphasis', AnnotationComponent);
    config.addCommand('emphasis', AnnotationCommand, { nodeType: Emphasis.type });
    config.addTool('emphasis', AnnotationTool);
    config.addConverter('html', EmphasisHTMLConverter);
    config.addConverter('xml', EmphasisXMLConverter);
    config.addStyle(__dirname, '_emphasis.scss');

    config.addIcon('emphasis', { 'fontawesome': 'fa-italic' });
    config.addLabel('emphasis', {
      en: 'Emphasis',
      de: 'Betonung'
    });
  }
};

