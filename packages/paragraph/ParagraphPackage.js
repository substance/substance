import Paragraph from './Paragraph'
import ParagraphComponent from './ParagraphComponent'
import ParagraphHTMLConverter from './ParagraphHTMLConverter'
import SwitchTextTypeCommand from '../../ui/SwitchTextTypeCommand'

export default {
  name: 'paragraph',
  configure: function (config) {
    config.addNode(Paragraph)
    config.addComponent(Paragraph.type, ParagraphComponent)
    config.addConverter('html', ParagraphHTMLConverter)
    config.addConverter('xml', ParagraphHTMLConverter)
    config.addCommand('paragraph', SwitchTextTypeCommand, {
      spec: { type: 'paragraph' },
      commandGroup: 'text-types'
    })
    config.addIcon('paragraph', { 'fontawesome': 'fa-paragraph' })
    config.addLabel('paragraph', {
      en: 'Paragraph',
      de: 'Paragraph'
    })
    config.addKeyboardShortcut('CommandOrControl+Alt+0', { command: 'paragraph' })
  },
  Paragraph: Paragraph,
  ParagraphComponent: ParagraphComponent,
  ParagraphHTMLConverter: ParagraphHTMLConverter
}
