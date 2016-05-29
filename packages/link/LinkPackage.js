'use strict';

var Link = require('./Link');
var LinkComponent = require('./LinkComponent');
var LinkCommand = require('./LinkCommand');
var LinkHTMLConverter = require('./LinkHTMLConverter');
var LinkTool = require('./LinkTool');
var EditLinkTool = require('./EditLinkTool');

module.exports = {
  name: 'link',
  configure: function(config, options) {
    config.addNode(Link);
    config.addComponent('link', LinkComponent);
    config.addConverter(LinkHTMLConverter);
    config.addCommand(LinkCommand);
    config.addTool(LinkTool);
    config.addTool(EditLinkTool, { overlay: true });
    config.addIcon('link', { 'fontawesome': 'fa-link'})
  }
};