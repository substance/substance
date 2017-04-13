import { platform } from '../../util'
import Blockquote from './Blockquote'
import BlockquoteComponent from './BlockquoteComponent'
import BlockquoteHTMLConverter from './BlockquoteHTMLConverter'
import { SwitchTextTypeCommand, Tool } from '../../ui'

export default {
  name: 'blockquote',
  configure: function(config) {
    config.addNode(Blockquote)
    config.addComponent(Blockquote.type, BlockquoteComponent)
    config.addConverter('html', BlockquoteHTMLConverter)
    config.addConverter('xml', BlockquoteHTMLConverter)
    config.addCommand('blockquote', SwitchTextTypeCommand, { spec: { type: 'blockquote' }})
    config.addTool('blockquote', Tool, { toolGroup: 'text-types' })
    config.addIcon('blockquote', { 'fontawesome': 'fa-quote-right' })
    config.addLabel('blockquote', {
      en: 'Blockquote',
      de: 'Blockzitat'
    })
    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+alt+b', { command: 'blockquote' })
    } else {
      config.addKeyboardShortcut('ctrl+alt+b', { command: 'blockquote' })
    }
  },
  Blockquote: Blockquote,
  BlockquoteComponent: BlockquoteComponent,
  BlockquoteHTMLConverter: BlockquoteHTMLConverter
}
