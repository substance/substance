import TextAlignCommand from './TextAlignCommand'
import { Tool } from '../../ui'

export default {
  name: 'text-align',
  configure: function(config) {
    config.addToolGroup('text-align')
    config.addCommand('align-left', TextAlignCommand, { textAlign: 'left' })
    config.addCommand('align-center', TextAlignCommand, { textAlign: 'center' })
    config.addCommand('align-right', TextAlignCommand, { textAlign: 'right' })

    config.addTool('align-left', Tool, { toolGroup: 'text-align' })
    config.addTool('align-center', Tool, { toolGroup: 'text-align' })
    config.addTool('align-right', Tool, { toolGroup: 'text-align' })

    config.addIcon('align-left', { 'fontawesome': 'fa-align-left' })
    config.addIcon('align-center', { 'fontawesome': 'fa-align-center' })
    config.addIcon('align-right', { 'fontawesome': 'fa-align-right' })
  }
}
