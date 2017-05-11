import { platform } from '../../util'
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

    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+shift+l', { command: 'align-left' })
      config.addKeyboardShortcut('cmd+shift+e', { command: 'align-center' })
      config.addKeyboardShortcut('cmd+shift+r', { command: 'align-right' })
    } else {
      config.addKeyboardShortcut('ctrl+shift+l', { command: 'align-left' })
      config.addKeyboardShortcut('ctrl+shift+e', { command: 'align-center' })
      config.addKeyboardShortcut('ctrl+shift+r', { command: 'align-right' })
    }

    config.addIcon('align-left', { 'fontawesome': 'fa-align-left' })
    config.addIcon('align-center', { 'fontawesome': 'fa-align-center' })
    config.addIcon('align-right', { 'fontawesome': 'fa-align-right' })

    config.addLabel('align-left', 'Left')
    config.addLabel('align-center', 'Center')
    config.addLabel('align-right', 'Right')

    config.addLabel('text-align', 'Text Align')
  }
}
