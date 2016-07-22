'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');
var Link = require('./Link');
var LinkComponent = require('./LinkComponent');
var LinkCommand = require('./LinkCommand');
var LinkHTMLConverter = require('./LinkHTMLConverter');
var EditLinkTool = require('./EditLinkTool');

module.exports = {
  name: 'link',
  configure: function(config) {
    config.addNode(Link);
    config.addComponent('link', LinkComponent);
    config.addCommand('link', LinkCommand);
    config.addTool('link', AnnotationTool);
    config.addTool('edit-link', EditLinkTool, { overlay: true });
    config.addConverter('html', LinkHTMLConverter);
    config.addStyle(__dirname, '_link.scss');
    config.addIcon('link', { 'fontawesome': 'fa-link'});
    config.addIcon('open-link', { 'fontawesome': 'fa-external-link' });
    config.addLabel('link', {
      en: 'Link',
      de: 'Link'
    });
  }
};