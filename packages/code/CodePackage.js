import { AnnotationComponent, AnnotationCommand, AnnotationTool } from '../../ui'
import Code from './Code'
import CodeHTMLConverter from './CodeHTMLConverter'

export default {
  name: 'code',
  configure: function(config, {toolGroup, disableCollapsedCursor}) {
    config.addNode(Code);
    config.addConverter('html', CodeHTMLConverter)
    config.addConverter('xml', CodeHTMLConverter)
    config.addComponent('code', AnnotationComponent)
    config.addCommand('code', AnnotationCommand, {
      disableCollapsedCursor,
      nodeType: Code.type
    })
    config.addTool('code', AnnotationTool, {
      toolGroup: toolGroup || 'annotations'
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
