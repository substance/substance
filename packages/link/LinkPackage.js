'use strict';

var Link = require('./Link');
var LinkComponent = require('./LinkComponent');
var LinkCommand = require('./LinkCommand');
var LinkHTMLConverter = require('./LinkHTMLConverter');
var LinkTool = require('./LinkTool');
var EditLinkTool = require('./EditLinkTool');

module.exports = {
  name: 'link',
  configure: function(config) {
    config.addNode(Link);
    config.addComponent(Link.static.name, LinkComponent);
    config.addConverter('html', LinkHTMLConverter);
    config.addCommand(LinkCommand);
    config.addTool(LinkTool);
    config.addTool(EditLinkTool, { overlay: true });
    config.addIcon(LinkCommand.static.name, { 'fontawesome': 'fa-link'});
    config.addIcon('open-link', { 'fontawesome': 'fa-external-link' });
    config.addLabel('link', {
      en: 'Link',
      de: 'Link'
    });
  }
};