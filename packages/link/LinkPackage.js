'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');
var Link = require('./Link');
var LinkComponent = require('./LinkComponent');
var LinkCommand = require('./LinkCommand');
var LinkHTMLConverter = require('./LinkHTMLConverter');
var LinkXMLConverter = require('./LinkXMLConverter');
var EditLinkTool = require('./EditLinkTool');

module.exports = {
  name: 'link',
  configure: function(config) {
    config.addNode(Link);
    config.addComponent('link', LinkComponent);
    config.addCommand('link', LinkCommand, {nodeType: 'link'});
    config.addTool('link', AnnotationTool);
    config.addTool('edit-link', EditLinkTool, { overlay: true });
    config.addConverter('html', LinkHTMLConverter);
    config.addConverter('xml', LinkXMLConverter);
    config.addStyle(__dirname, '_link.scss');
    config.addIcon('link', { 'fontawesome': 'fa-link'});
    config.addIcon('open-link', { 'fontawesome': 'fa-external-link' });
    config.addLabel('link', {
      en: 'Link',
      de: 'Link'
    });
  }
};