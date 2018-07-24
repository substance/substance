import {
  ToolDropdown, ToolGroup, ToolPrompt, ToolPanel, MenuGroup, ToolSeparator
} from '../../deprecated'

export default {
  name: 'tool-panel',
  configure (config) {
    config.addComponent('tool-panel', ToolPanel)
    config.addComponent('tool-dropdown', ToolDropdown)
    config.addComponent('tool-group', ToolGroup)
    config.addComponent('menu-group', MenuGroup)
    config.addComponent('tool-prompt', ToolPrompt)
    config.addComponent('tool-separator', ToolSeparator)
  }
}
