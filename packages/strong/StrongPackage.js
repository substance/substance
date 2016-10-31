import Strong from './Strong'
import StrongHTMLConverter from './StrongHTMLConverter'
import StrongXMLConverter from './StrongXMLConverter'
import AnnotationCommand from '../../ui/AnnotationCommand'
import AnnotationComponent from '../../ui/AnnotationComponent'
import AnnotationTool from '../../ui/AnnotationTool'
import platform from '../../util/platform'

export default {
  name: 'strong',
  configure: function(config, options) {
    options = options || {}
    config.addNode(Strong)
    config.addConverter('html', StrongHTMLConverter)
    config.addConverter('xml', StrongXMLConverter)
    config.addComponent('strong', AnnotationComponent)
    config.addCommand('strong', AnnotationCommand, { nodeType: 'strong' })
    config.addTool('strong', AnnotationTool, {
      toolGroup: options.toolGroup || 'annotations'
    })
    config.addIcon('strong', { 'fontawesome': 'fa-bold' })
    config.addLabel('strong', {
      en: 'Strong',
      de: 'Fett'
    })
    if (platform.isMac) {
      config.addKeyboardShortcut('cmd+b', { command: 'strong' })
    } else {
      config.addKeyboardShortcut('ctrl+b', { command: 'strong' })
    }
  },
  Strong: Strong,
  StrongHTMLConverter: StrongHTMLConverter
}
