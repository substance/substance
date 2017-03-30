import { AnnotationCommand, AnnotationTool, AnnotationComponent } from '../../ui'
import Subscript from './Subscript'
import SubscriptHTMLConverter from './SubscriptHTMLConverter'

export default {
  name: 'subscript',
  configure: function(config, {toolGroup, disableCollapsedCursor}) {
    config.addNode(Subscript)
    config.addConverter('html', SubscriptHTMLConverter)
    config.addConverter('xml', SubscriptHTMLConverter)
    config.addComponent('subscript', AnnotationComponent)
    config.addCommand('subscript', AnnotationCommand, {
      nodeType: 'subscript',
      disableCollapsedCursor
    })
    config.addTool('subscript', AnnotationTool, {toolGroup: toolGroup || 'annotations'})
    config.addIcon('subscript', { 'fontawesome': 'fa-subscript' })
    config.addLabel('subscript', {
      en: 'Subscript',
      de: 'Tiefgestellt'
    })
  },
  Subscript,
  SubscriptHTMLConverter
}
