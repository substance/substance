'use strict';

var Subscript = require('./Subscript');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');
var SubscriptHTMLConverter = require('./SubscriptHTMLConverter');
var SubscriptXMLConverter = require('./SubscriptXMLConverter');

module.exports = {
  name: 'subscript',
  configure: function(config) {
    config.addNode(Subscript);
    config.addComponent('subscript', AnnotationComponent);
    config.addCommand('Subscript', AnnotationCommand, { nodeType: 'subscript' });
    config.addTool('subscript', AnnotationTool);
    config.addIcon('subscript', { 'fontawesome': 'fa-subscript' });
    config.addConverter('html', SubscriptHTMLConverter);
    config.addConverter('xml', SubscriptXMLConverter);
    config.addStyle(__dirname, '_subscript.scss');
    config.addLabel('subscript', {
      en: 'Subscript',
      de: 'Tiefgestellt'
    });
  }
};
