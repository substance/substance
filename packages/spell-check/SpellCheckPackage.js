import SpellError from './SpellError'
import CorrectionTool from './CorrectionTool'
import SpellCheckCommand from './SpellCheckCommand'

export default {
  name: 'spell-check',
  configure: function(config) {
    config.addNode(SpellError)
    config.addCommand('correction', SpellCheckCommand)
    config.addTool('correction', CorrectionTool, {toolGroup: 'context-menu-primary'})
  }
}
