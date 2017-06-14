import { ToolDropdown, ToolGroup, ToolPrompt, ToolPanel } from '../../ui'
import ToolSeparator from './ToolSeparator'

export default {
  name: 'tool-panel',
  configure(config) {
    config.addComponent('tool-panel', ToolPanel)
    config.addComponent('tool-dropdown', ToolDropdown)
    config.addComponent('tool-group', ToolGroup)
    config.addComponent('tool-prompt', ToolPrompt)
    config.addComponent('tool-separator', ToolSeparator)
  }
}
