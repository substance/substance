import SpellError from './SpellError'
import CorrectionTool from './CorrectionTool'
import SpellCheckCommand from './SpellCheckCommand'

export default {
  name: 'spell-check',
  configure: function(config) {
    config.addNode(SpellError)
    config.addCommand('correction', SpellCheckCommand, {
      commandGroup: 'spell-check'
    })
    config.addTool('correction', CorrectionTool)
  }
}
