import Blockquote from './Blockquote'
import BlockquoteComponent from './BlockquoteComponent'
import BlockquoteHTMLConverter from './BlockquoteHTMLConverter'
import { SwitchTextTypeCommand } from '../../ui'

export default {
  name: 'blockquote',
  configure: function(config) {
    config.addNode(Blockquote)
    config.addComponent(Blockquote.type, BlockquoteComponent)
    config.addConverter('html', BlockquoteHTMLConverter)
    config.addConverter('xml', BlockquoteHTMLConverter)
    config.addCommand('blockquote', SwitchTextTypeCommand, {
      spec: { type: 'blockquote' },
      commandGroup: 'text-types'
    })
    config.addIcon('blockquote', { 'fontawesome': 'fa-quote-right' })
    config.addLabel('blockquote', {
      en: 'Blockquote',
      de: 'Blockzitat'
    })
    config.addKeyboardShortcut('CommandOrControl+Alt+B', { command: 'blockquote' })
  },
  Blockquote: Blockquote,
  BlockquoteComponent: BlockquoteComponent,
  BlockquoteHTMLConverter: BlockquoteHTMLConverter
}
