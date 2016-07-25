'use strict';

var SwitchTextTypeCommand = require('./SwitchTextTypeCommand');
var SwitchTextTypeTool = require('./SwitchTextTypeTool');
var UndoCommand = require('./UndoCommand');
var RedoCommand = require('./RedoCommand');
var Tool = require('../../ui/Tool');

module.exports = {
  name: 'base',
  configure: function(config, options) {
    // Commands
    config.addCommand('switch-text-type', SwitchTextTypeCommand);
    config.addCommand('undo', UndoCommand);
    config.addCommand('redo', RedoCommand);
    // Tools
    config.addTool('switch-text-type', SwitchTextTypeTool);
    config.addTool('undo', Tool);
    config.addTool('redo', Tool);
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