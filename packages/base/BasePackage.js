import SwitchTextTypeCommand from './SwitchTextTypeCommand'
import SwitchTextTypeTool from './SwitchTextTypeTool'
import UndoCommand from './UndoCommand'
import RedoCommand from './RedoCommand'
import Tool from '../tools/Tool'
import ToolGroup from '../tools/ToolGroup'

export default {
  name: 'base',
  configure: function(config) {

    // Register class to handle the text tool target
    config.addComponent('tool-target-text', ToolGroup)
    config.addComponent('tool-target-document', ToolGroup)

    // Commands
    config.addCommand('undo', UndoCommand)
    config.addCommand('redo', RedoCommand)
    config.addCommand('switch-text-type', SwitchTextTypeCommand)
    // Tools
    config.addTool('undo', Tool, {target: 'document'})
    config.addTool('redo', Tool, {target: 'document'})
    config.addTool('switch-text-type', SwitchTextTypeTool, {target: 'text'})

    // Icons
    config.addIcon('undo', { 'fontawesome': 'fa-undo' })
    config.addIcon('redo', { 'fontawesome': 'fa-repeat' })
    config.addIcon('edit', { 'fontawesome': 'fa-cog' })
    config.addIcon('delete', { 'fontawesome': 'fa-times' })
    config.addIcon('expand', { 'fontawesome': 'fa-arrows-h' })
    config.addIcon('truncate', { 'fontawesome': 'fa-arrows-h' })
    // Labels
    config.addLabel('undo', {
      en: 'Undo',
      de: 'Rückgängig'
    })
    config.addLabel('redo', {
      en: 'Redo',
      de: 'Wiederherstellen'
    })
    config.addLabel('container-selection', {
      en: 'Container',
      de: 'Container'
    })
    config.addLabel('container', {
      en: 'Container',
      de: 'Container'
    })
    config.addLabel('insert-container', {
      en: 'Insert Container',
      de: 'Container einfügen'
    })
  }
}
