import SaveCommand from './SaveCommand'

export default {
  name: 'persistence',
  configure: function(config) {
    config.addCommand('save', SaveCommand, {
      commandGroup: 'persistence'
    })
    config.addIcon('save', { 'fontawesome': 'fa-save' })
    config.addLabel('save', {
      en: 'Save',
      de: 'Speichern'
    })
    config.addKeyboardShortcut('CommandOrControl+S', { command: 'save' })

  },
  SaveCommand: SaveCommand
}
