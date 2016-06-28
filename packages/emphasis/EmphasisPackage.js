'use strict';

var Emphasis = require('./Emphasis');
var EmphasisTool = require('./EmphasisTool');
var EmphasisCommand = require('./EmphasisCommand');
var EmphasisHTMLConverter = require('./EmphasisHTMLConverter');
var EmphasisXMLConverter = require('./EmphasisXMLConverter');
var path = require('path');

module.exports = {
  name: 'emphasis',
  configure: function(config) {
    config.addNode(Emphasis);
    config.addCommand(EmphasisCommand);
    config.addTool(EmphasisTool);
    config.addConverter('html', EmphasisHTMLConverter);
    config.addConverter('xml', EmphasisXMLConverter);
    config.addStyle(path.join(__dirname, '_emphasis.scss'));

    config.addIcon('emphasis', { 'fontawesome': 'fa-italic' });
    config.addLabel('emphasis', {
      en: 'Emphasis',
      de: 'Betonung'
    });
  }
};

