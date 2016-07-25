'use strict';

var Subscript = require('./Subscript');
var SubscriptHTMLConverter = require('./SubscriptHTMLConverter');
var SubscriptXMLConverter = require('./SubscriptXMLConverter');
var SubscriptTool = require('./SubscriptTool');
var SubscriptCommand = require('./SubscriptCommand');

module.exports = {
  name: 'subscript',
  configure: function(config) {
    config.addNode(Subscript);
    config.addConverter('html', SubscriptHTMLConverter);
    config.addConverter('xml', SubscriptXMLConverter);
    config.addCommand(SubscriptCommand);
    config.addTool(SubscriptTool);
    config.addIcon(SubscriptCommand.static.name, { 'fontawesome': 'fa-subscript' });
    config.addStyle(__dirname, '_subscript.scss');
    config.addLabel('subscript', {
      en: 'Subscript',
      de: 'Tiefgestellt'
    });
  }
};
