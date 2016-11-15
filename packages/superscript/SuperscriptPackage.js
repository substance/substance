import Superscript from './Superscript'
import SuperscriptHTMLConverter from './SuperscriptHTMLConverter'
import SuperscriptXMLConverter from './SuperscriptXMLConverter'
import AnnotationCommand from '../../ui/AnnotationCommand'
import AnnotationComponent from '../../ui/AnnotationComponent'
import AnnotationTool from '../../ui/AnnotationTool'

export default {
  name: 'superscript',
  configure: function(config, options) {
    config.addNode(Superscript)
    config.addConverter('html', SuperscriptHTMLConverter)
    config.addConverter('xml', SuperscriptXMLConverter)
    config.addComponent('superscript', AnnotationComponent)
    config.addCommand('superscript', AnnotationCommand, { nodeType: 'superscript' })
    config.addTool('superscript', AnnotationTool, {toolGroup: options.toolGroup || 'annotations'})
    config.addIcon('superscript', { 'fontawesome': 'fa-superscript' })
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    })
  },
  Superscript: Superscript,
  SuperscriptHTMLConverter: SuperscriptHTMLConverter
}
