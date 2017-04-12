import TextAlignTool from './TextAlignTool'
import TextAlignCommand from './TextAlignCommand'

export default {
  name: 'text-align',
  configure: function(config) {
    config.addCommand('text-align', TextAlignCommand, {
      disableCollapsedCursor: true
    })
    config.addTool('text-align', TextAlignTool, {
      toolGroup: 'annotations'
    })
    config.addIcon('align-left', { 'fontawesome': 'fa-align-left' })
    config.addIcon('align-center', { 'fontawesome': 'fa-align-center' })
    config.addIcon('align-right', { 'fontawesome': 'fa-align-right' })
  }
}
