import CorrectionTool from './CorrectionTool'
import SpellCheckCommand from './SpellCheckCommand'

export default {
  name: 'spell-check',
  configure: function(config) {
    config.addCommand('correction', SpellCheckCommand, {
      commandGroup: 'spell-check'
    })
    config.addTool('correction', CorrectionTool)
  }
}
