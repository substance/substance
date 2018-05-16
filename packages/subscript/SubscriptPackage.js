import AnnotationCommand from '../../ui/AnnotationCommand'
import AnnotationComponent from '../../ui/AnnotationComponent'
import Subscript from './Subscript'
import SubscriptHTMLConverter from './SubscriptHTMLConverter'

export default {
  name: 'subscript',
  configure: function (config) {
    config.addNode(Subscript)
    config.addConverter('html', SubscriptHTMLConverter)
    config.addConverter('xml', SubscriptHTMLConverter)
    config.addComponent('subscript', AnnotationComponent)
    config.addCommand('subscript', AnnotationCommand, {
      nodeType: 'subscript',
      commandGroup: 'annotations'
    })
    config.addIcon('subscript', { 'fontawesome': 'fa-subscript' })
    config.addLabel('subscript', {
      en: 'Subscript',
      de: 'Tiefgestellt'
    })
  },
  Subscript,
  SubscriptHTMLConverter
}
