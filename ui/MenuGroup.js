import ToolGroup from './ToolGroup'
import MenuItem from './MenuItem'

/*
  Tools rendered in vertical menu

  ```
  $$(MenuGroup, {
    name: 'cell-types',
    contextual: true,
    showDisabled: true,
    style: 'descriptive',
    theme: 'dark',
    commandGroups: ['text-types']
  })
  ```
*/
export default class MenuGroup extends ToolGroup {

  _getToolClass(commandName) {
    let tools = this.context.tools
    return tools[commandName] || MenuItem
  }

  _getClassNames() {
    return 'sc-menu-group'
  }
}
