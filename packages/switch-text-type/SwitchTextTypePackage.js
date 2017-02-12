import SwitchTextTypeCommand from './SwitchTextTypeCommand'
import SwitchTextTypeTool from './SwitchTextTypeTool'

export default {
  name: 'switch-text-type',
  configure: function(config, options) {
    config.addToolGroup('text')
    config.addCommand('switch-text-type', SwitchTextTypeCommand)
    config.addTool('switch-text-type', SwitchTextTypeTool, {toolGroup: options.toolGroup || 'text'})
  }
}
