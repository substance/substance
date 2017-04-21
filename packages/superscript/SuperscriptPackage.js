import { AnnotationCommand, AnnotationComponent } from '../../ui'
import Superscript from './Superscript'
import SuperscriptHTMLConverter from './SuperscriptHTMLConverter'

export default {
  name: 'superscript',
  configure: function(config) {
    config.addNode(Superscript)
    config.addConverter('html', SuperscriptHTMLConverter)
    config.addConverter('xml', SuperscriptHTMLConverter)
    config.addComponent('superscript', AnnotationComponent)
    config.addCommand('superscript', AnnotationCommand, {
      nodeType: 'superscript',
      commandGroup: 'annotations'
    })
    config.addIcon('superscript', { 'fontawesome': 'fa-superscript' })
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    })
  },
  Superscript,
  SuperscriptHTMLConverter
}
