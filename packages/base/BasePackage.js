'use strict';

module.exports = {
  name: 'base',
  configure: function(config, options) {
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

    // Substance base styles
    if (!options.noBaseStyles) {
      config.addStyle(__dirname, '..', '..', 'styles', 'base', '_all');
    }

    // Styles
    config.addStyle(__dirname, '_base.scss');

    // Core component styles
    config.addStyle(__dirname, '..', '..', 'styles', 'components', '_all');

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
      en: 'Container',
      de: 'Container'
    });
    config.addLabel('container', {
      en: 'Container',
      de: 'Container'
    });
    config.addLabel('insert-container', {
      en: 'Insert Container',
      de: 'Container einfügen'
    });
  }
};