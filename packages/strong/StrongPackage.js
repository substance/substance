import { platform } from '../../util'
import { AnnotationCommand, AnnotationTool } from '../../ui'
import Strong from './Strong'
import StrongHTMLConverter from './StrongHTMLConverter'
import StrongComponent from './StrongComponent'

export default {
  name: 'strong',
  configure: function(config, {toolGroup, disableCollapsedCursor}) {
    config.addNode(Strong)
    config.addConverter('html', StrongHTMLConverter)
    config.addConverter('xml', StrongHTMLConverter)
    config.addComponent('strong', StrongComponent)

    config.addCommand('strong', AnnotationCommand, {
      nodeType: 'strong',
      disableCollapsedCursor
    })
    config.addTool('strong', AnnotationTool, {
      toolGroup: toolGroup || 'annotations'
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
  Strong,
  StrongComponent,
  StrongHTMLConverter
}
