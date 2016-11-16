import Subscript from './Subscript'
import SubscriptHTMLConverter from './SubscriptHTMLConverter'
import SubscriptXMLConverter from './SubscriptXMLConverter'
import AnnotationCommand from '../../ui/AnnotationCommand'
import AnnotationComponent from '../../ui/AnnotationComponent'
import AnnotationTool from '../../ui/AnnotationTool'

export default {
  name: 'subscript',
  configure: function(config, options) {
    config.addNode(Subscript)
    config.addConverter('html', SubscriptHTMLConverter)
    config.addConverter('xml', SubscriptXMLConverter)
    config.addComponent('subscript', AnnotationComponent)
    config.addCommand('subscript', AnnotationCommand, { nodeType: 'subscript' })
    config.addTool('subscript', AnnotationTool, {toolGroup: options.toolGroup || 'annotations'})
    config.addIcon('subscript', { 'fontawesome': 'fa-subscript' })
    config.addLabel('subscript', {
      en: 'Subscript',
      de: 'Tiefgestellt'
    })
  },
  Subscript: Subscript,
  SubscriptHTMLConverter: SubscriptHTMLConverter
}
