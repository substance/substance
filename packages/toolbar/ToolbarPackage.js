import Toolbar from './Toolbar'
import ToolGroup from './ToolGroup'
import ToolDropdown from './ToolDropdown'

export default {
  name: 'toolbar',
  configure(config) {
    config.addComponent('toolbar', Toolbar)
    config.addComponent('tool-group', ToolGroup)
    config.addComponent('tool-dropdown', ToolDropdown)
  },
  Toolbar,
  ToolGroup,
  ToolDropdown
}