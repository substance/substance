import Blockquote from './Blockquote'
import BlockquoteComponent from './BlockquoteComponent'
import BlockquoteHTMLConverter from './BlockquoteHTMLConverter'

export default {
  name: 'blockquote',
  configure: function(config) {
    config.addNode(Blockquote);
    config.addComponent(Blockquote.type, BlockquoteComponent)
    config.addConverter('html', BlockquoteHTMLConverter)
    config.addConverter('xml', BlockquoteHTMLConverter)
    config.addTextType({
      name: 'blockquote',
      data: {type: 'blockquote'}
    })
    config.addLabel('blockquote', {
      en: 'Blockquote',
      de: 'Blockzitat'
    })
  },
  Blockquote: Blockquote,
  BlockquoteComponent: BlockquoteComponent,
  BlockquoteHTMLConverter: BlockquoteHTMLConverter
}