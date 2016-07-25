'use strict';

var SaveCommand = require('./SaveCommand');
var Tool = require('../../ui/Tool');

module.exports = {
  name: 'persistence',
  configure: function(config) {
    config.addCommand('save', SaveCommand);
    config.addTool('save', Tool);
    config.addIcon('save', { 'fontawesome': 'fa-save' });
    config.addLabel('save', {
      en: 'Save',
      de: 'Speichern'
    });
  }
};