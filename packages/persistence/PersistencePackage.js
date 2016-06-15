'use strict';

module.exports = {
  name: 'persistence',
  configure: function(config) {
    config.addCommand(require('./SaveCommand'));
    config.addTool(require('./SaveTool'));
    // Icons
    config.addIcon('save', { 'fontawesome': 'fa-save' });
    // Labels
    config.addLabel('save', {
      en: 'Save',
      de: 'Speichern'
    });
  }
};