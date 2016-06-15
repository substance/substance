'use strict';

module.exports = {
  name: 'base',
  configure: function(config) {
    config.addCommand(require('./SwitchTextTypeCommand'));
    config.addCommand(require('./UndoCommand'));
    config.addCommand(require('./RedoCommand'));
    config.addTool(require('./UndoTool'));
    config.addTool(require('./RedoTool'));
    config.addTool(require('./SwitchTextTypeTool'));
    // Icons
    config.addIcon('undo', { 'fontawesome': 'fa-undo' });
    config.addIcon('redo', { 'fontawesome': 'fa-repeat' });
    config.addIcon('edit', { 'fontawesome': 'fa-cog' });
    config.addIcon('delete', { 'fontawesome': 'fa-times' });
    config.addIcon('expand', { 'fontawesome': 'fa-arrows-h' });
    config.addIcon('truncate', { 'fontawesome': 'fa-arrows-h' });
    // Labels
    config.addLabel('undo', {
      en: 'Undo',
      de: 'Rückgängig'
    });
    config.addLabel('redo', {
      en: 'Redo',
      de: 'Wiederherstellen'
    });
    config.addLabel('container-selection', {
      en: 'Multiple Elements',
      de: 'Mehrere Elemente'
    });
  }
};