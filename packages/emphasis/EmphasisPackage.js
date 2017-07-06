import { AnnotationCommand } from '../../ui'
import Emphasis from './Emphasis'
import EmphasisHTMLConverter from './EmphasisHTMLConverter'
import EmphasisComponent from './EmphasisComponent'

export default {
  name: 'emphasis',
  configure: function(config) {
    config.addNode(Emphasis)
    config.addConverter('html', EmphasisHTMLConverter)
    config.addConverter('xml', EmphasisHTMLConverter)
    config.addComponent('emphasis', EmphasisComponent)
    config.addCommand('emphasis', AnnotationCommand, {
      nodeType: Emphasis.type,
      commandGroup: 'annotations'
    })
    config.addIcon('emphasis', { 'fontawesome': 'fa-italic' });
    config.addLabel('emphasis', {
      en: 'Emphasis',
      de: 'Betonung'
    })
    config.addKeyboardShortcut('CommandOrControl+i', { command: 'emphasis' })
  },
  Emphasis,
  EmphasisComponent,
  EmphasisHTMLConverter
}
