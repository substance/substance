import Codeblock from './Codeblock'
import CodeblockComponent from './CodeblockComponent'
import CodeblockHTMLConverter from './CodeblockHTMLConverter'
import { SwitchTextTypeCommand } from '../../ui'

export default {
  name: 'codeblock',
  configure: function(config) {
    config.addNode(Codeblock);
    config.addComponent('codeblock', CodeblockComponent)
    config.addConverter('html', CodeblockHTMLConverter)
    config.addConverter('xml', CodeblockHTMLConverter)
    config.addCommand('codeblock', SwitchTextTypeCommand, {
      spec: { type: 'codeblock' },
      commandGroup: 'text-types'
    })
    config.addIcon('codeblock', { 'fontawesome': 'fa-quote-right' })
    config.addLabel('codeblock', {
      en: 'Codeblock',
      de: 'Codeblock'
    })
    config.addKeyboardShortcut('CommandOrControl+Alt+C', { command: 'codeblock' })
  },
  Codeblock: Codeblock,
  CodeblockComponent: CodeblockComponent,
  CodeblockHTMLConverter: CodeblockHTMLConverter
}
