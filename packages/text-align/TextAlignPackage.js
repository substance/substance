import TextAlignCommand from './TextAlignCommand'

export default {
  name: 'text-align',
  configure: function(config) {
    config.addCommand('align-left', TextAlignCommand, {
      textAlign: 'left',
      commandGroup: 'text-align'
    })
    config.addCommand('align-center', TextAlignCommand, {
      textAlign: 'center',
      commandGroup: 'text-align'
    })
    config.addCommand('align-right', TextAlignCommand, {
      textAlign: 'right',
      commandGroup: 'text-align'
    })

    config.addKeyboardShortcut('CommandOrControl+shift+l', { command: 'align-left' })
    config.addKeyboardShortcut('CommandOrControl+shift+e', { command: 'align-center' })
    config.addKeyboardShortcut('CommandOrControl+shift+r', { command: 'align-right' })

    config.addIcon('align-left', { 'fontawesome': 'fa-align-left' })
    config.addIcon('align-center', { 'fontawesome': 'fa-align-center' })
    config.addIcon('align-right', { 'fontawesome': 'fa-align-right' })

    config.addLabel('align-left', 'Left')
    config.addLabel('align-center', 'Center')
    config.addLabel('align-right', 'Right')

    config.addLabel('text-align', 'Text Align')
  }
}
