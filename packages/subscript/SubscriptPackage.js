'use strict';

var Subscript = require('./Subscript');
var SubscriptHTMLConverter = require('./SubscriptHTMLConverter');
var SubscriptXMLConverter = require('./SubscriptXMLConverter');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');

module.exports = {
  name: 'subscript',
  configure: function(config) {
    config.addNode(Subscript);
    config.addConverter('html', SubscriptHTMLConverter);
    config.addConverter('xml', SubscriptXMLConverter);
    config.addComponent('subscript', AnnotationComponent);
    config.addCommand('subscript', AnnotationCommand, { nodeType: 'subscript' });
    config.addTool('subscript', AnnotationTool);
    config.addIcon('subscript', { 'fontawesome': 'fa-subscript' });
    config.addLabel('subscript', {
      en: 'Subscript',
      de: 'Tiefgestellt'
    });
  }
};
