import { platform } from '../../util'
import Codeblock from './Codeblock'
import CodeblockComponent from './CodeblockComponent'
import CodeblockHTMLConverter from './CodeblockHTMLConverter'
import { SwitchTextTypeCommand, Tool } from '../../ui'

export default {
  name: 'codeblock',
  configure: function(config) {
    config.addNode(Codeblock);
    config.addComponent('codeblock', CodeblockComponent)
    config.addConverter('html', CodeblockHTMLConverter)
    config.addConverter('xml', CodeblockHTMLConverter)

    config.addCommand('codeblock', SwitchTextTypeCommand, { spec: { type: 'codeblock' }})
    config.addTool('codeblock', Tool, { toolGroup: 'text-types' })
    config.addIcon('codeblock', { 'fontawesome': 'fa-quote-right' })
    config.addLabel('codeblock', {
      en: 'Codeblock',
      de: 'Codeblock'
    })
    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+alt+c', { command: 'codeblock' })
    } else {
      config.addKeyboardShortcut('ctrl+alt+c', { command: 'codeblock' })
    }
  },
  Codeblock: Codeblock,
  CodeblockComponent: CodeblockComponent,
  CodeblockHTMLConverter: CodeblockHTMLConverter
}
