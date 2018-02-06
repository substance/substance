import ToolDropdown from '../../ui/ToolDropdown'
import ToolGroup from '../../ui/ToolGroup'
import ToolPrompt from '../../ui/ToolPrompt'
import ToolPanel from '../../ui/ToolPanel'
import MenuGroup from '../../ui/MenuGroup'
import ToolSeparator from './ToolSeparator'

export default {
  name: 'tool-panel',
  configure(config) {
    config.addComponent('tool-panel', ToolPanel)
    config.addComponent('tool-dropdown', ToolDropdown)
    config.addComponent('tool-group', ToolGroup)
    config.addComponent('menu-group', MenuGroup)
    config.addComponent('tool-prompt', ToolPrompt)
    config.addComponent('tool-separator', ToolSeparator)
  }
}
