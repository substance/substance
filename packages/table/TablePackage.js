'use strict';

var TableNode = require('./TableNode');
var TableComponent = require('./TableComponent');
var InsertTableCommand = require('./InsertTableCommand');
var Tool = require('../../ui/Tool');

module.exports = {
  name: 'table',
  configure: function(config) {
    config.addNode(TableNode);
    config.addComponent('table', TableComponent);
    config.addCommand('insert-table', InsertTableCommand);
    config.addTool('insert-table', Tool);
    config.addIcon('insert-table', { 'fontawesome': 'fa-table' });
    config.addLabel('table', {
      en: 'Table',
      de: 'Tabelle'
    });
  }
};
