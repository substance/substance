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