import Code from './Code'
import CodeHTMLConverter from './CodeHTMLConverter'
import CodeXMLConverter from './CodeXMLConverter'
import AnnotationComponent from '../../ui/AnnotationComponent'
import AnnotationCommand from '../../ui/AnnotationCommand'
import AnnotationTool from '../../ui/AnnotationTool'

export default {
  name: 'code',
  configure: function(config, options) {
    config.addNode(Code);
    config.addConverter('html', CodeHTMLConverter)
    config.addConverter('xml', CodeXMLConverter)
    config.addComponent('code', AnnotationComponent)
    config.addCommand('code', AnnotationCommand, { nodeType: Code.type })
    config.addTool('code', AnnotationTool, {toolGroup: options.toolGroup || 'annotations'})
    config.addIcon('code', { 'fontawesome': 'fa-code' })
    config.addLabel('code', {
      en: 'Code',
      de: 'Code'
    })
  },
  Code: Code,
  CodeHTMLConverter: CodeHTMLConverter
}
