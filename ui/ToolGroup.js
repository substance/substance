import { Component, ToggleTool } from '.'
import { forEach } from '../util'

/*
  Tools rendered in flat tool group

  ```
  $$(ToolGroup, {
    name: 'annotations',
    type: 'tool-group',
    contextual: true,
    style: 'minimal', // icon only display
    commandGroups: ['text-types']
  })
  ```
*/
class ToolGroup extends Component {

  /*
    Determine wether a tool should be shown or not
  */
  isToolEnabled(commandName, commandState) {
    let enabled = true
    if (this.props.contextual && !commandState.showInContext) {
      enabled = false
    }
    if (commandState.disabled) {
      enabled = false
    }
    return enabled
  }

  /*
    Returns true if at least one command is enabled
  */
  hasEnabledTools(commandStates) {
    if (!commandStates) {
      commandStates = this._getCommandStates()
    }
    let hasEnabledTools
    forEach(commandStates, (commandState, commandName) => {
      if (this.isToolEnabled(commandName, commandState)) {
        hasEnabledTools = true
      }
    })
    return hasEnabledTools
  }

  render($$) {
    let commandStates = this._getCommandStates()
    let tools = this.context.tools
    let el = $$('div').addClass('sc-tool-group')
    el.addClass('sm-'+this.props.name)
    forEach(commandStates, (commandState, commandName) => {
      if (this.isToolEnabled(commandName, commandState)) {
        let ToolClass = tools[commandName] || ToggleTool
        el.append(
          $$(ToolClass, {
            name: commandName,
            commandState: commandState,
            style: this.props.style
          }).ref(commandName)
        )
      }
    })
    return el
  }

  /*
    We map an array of command groups to array command states
  */
  _getCommandStates() {
    let commandStates = this.context.commandManager.getCommandStates()
    let commandGroups = this.context.commandGroups
    let filteredCommandStates = {} // command states objects of that group
    this.props.commandGroups.forEach((commandGroup) => {
      commandGroups[commandGroup].forEach((commandName) => {
        filteredCommandStates[commandName] = commandStates[commandName]
      })
    })
    return filteredCommandStates
  }
}

export default ToolGroup
