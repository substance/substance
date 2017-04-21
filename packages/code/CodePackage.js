import { AnnotationComponent, AnnotationCommand } from '../../ui'
import Code from './Code'
import CodeHTMLConverter from './CodeHTMLConverter'

export default {
  name: 'code',
  configure: function(config) {
    config.addNode(Code);
    config.addConverter('html', CodeHTMLConverter)
    config.addConverter('xml', CodeHTMLConverter)
    config.addComponent('code', AnnotationComponent)
    config.addCommand('code', AnnotationCommand, {
      nodeType: Code.type,
      commandGroup: 'annotations'
    })
    config.addIcon('code', { 'fontawesome': 'fa-code' })
    config.addLabel('code', {
      en: 'Code',
      de: 'Code'
    })
  },
  Code: Code,
  CodeHTMLConverter: CodeHTMLConverter
}
