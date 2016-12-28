import Emphasis from './Emphasis'
import EmphasisHTMLConverter from './EmphasisHTMLConverter'
import EmphasisXMLConverter from './EmphasisXMLConverter'
import AnnotationCommand from '../../ui/AnnotationCommand'
import EmphasisComponent from './EmphasisComponent'
import AnnotationTool from '../../ui/AnnotationTool'
import platform from '../../util/platform'

export default {
  name: 'emphasis',
  configure: function(config, {toolGroup, disableCollapsedCursor}) {
    config.addNode(Emphasis)
    config.addConverter('html', EmphasisHTMLConverter)
    config.addConverter('xml', EmphasisXMLConverter)
    config.addComponent('emphasis', EmphasisComponent)
    config.addCommand('emphasis', AnnotationCommand, {
      nodeType: Emphasis.type,
      disableCollapsedCursor
    })
    config.addTool('emphasis', AnnotationTool, {
      toolGroup: toolGroup || 'annotations'
    })
    config.addIcon('emphasis', { 'fontawesome': 'fa-italic' });
    config.addLabel('emphasis', {
      en: 'Emphasis',
      de: 'Betonung'
    })
    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+i', { command: 'emphasis' })
    } else {
      config.addKeyboardShortcut('ctrl+i', { command: 'emphasis' })
    }
  },
  Emphasis: Emphasis,
  EmphasisHTMLConverter: EmphasisHTMLConverter
}
