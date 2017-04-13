import { platform } from '../../util'
import Paragraph from './Paragraph'
import ParagraphComponent from './ParagraphComponent'
import ParagraphHTMLConverter from './ParagraphHTMLConverter'
import { SwitchTextTypeCommand, Tool } from '../../ui'

export default {
  name: 'paragraph',
  configure: function(config) {
    config.addNode(Paragraph)
    config.addComponent(Paragraph.type, ParagraphComponent)
    config.addConverter('html', ParagraphHTMLConverter)
    config.addConverter('xml', ParagraphHTMLConverter)
    config.addCommand('paragraph', SwitchTextTypeCommand, { spec: { type: 'paragraph' }})
    config.addTool('paragraph', Tool, { toolGroup: 'text-types' })
    config.addIcon('paragraph', { 'fontawesome': 'fa-paragraph' })
    config.addLabel('paragraph', {
      en: 'Paragraph',
      de: 'Paragraph'
    })
    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+alt+0', { command: 'paragraph' })
    } else {
      config.addKeyboardShortcut('ctrl+alt+0', { command: 'paragraph' })
    }
  },
  Paragraph: Paragraph,
  ParagraphComponent: ParagraphComponent,
  ParagraphHTMLConverter: ParagraphHTMLConverter
}
