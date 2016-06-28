'use strict';

var Subscript = require('./Subscript');
var SubscriptTool = require('./SubscriptTool');
var SubscriptCommand = require('./SubscriptCommand');
var path = require('path');

module.exports = {
  name: 'subscript',
  configure: function(config) {
    config.addNode(Subscript);
    config.addCommand(SubscriptCommand);
    config.addTool(SubscriptTool);
    config.addIcon(SubscriptCommand.static.name, { 'fontawesome': 'fa-subscript' });
    config.addStyle(path.join(__dirname, '_subscript.scss'));
    config.addLabel('subscript', {
      en: 'Subscript',
      de: 'Tiefgestellt'
    });
  }
};
