import { Tool } from '../../ui'
import SaveCommand from './SaveCommand'

export default {
  name: 'persistence',
  configure: function(config) {
    config.addCommand('save', SaveCommand)
    config.addTool('save', Tool, {toolGroup: 'document'})
    config.addIcon('save', { 'fontawesome': 'fa-save' })
    config.addLabel('save', {
      en: 'Save',
      de: 'Speichern'
    })
  },
  SaveCommand: SaveCommand
}