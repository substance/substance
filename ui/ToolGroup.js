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
  _isToolVisible(commandName, commandState) {
    let show = true
    if (this.props.contextual && !commandState.showInContext) {
      show = false
    }
    if (commandState.disabled) {
      show = false
    }
    return show
  }

  /*
    Returns true if at least one command is enabled
  */
  _isVisible(commandStates) {
    let isVisible
    forEach(commandStates, (commandState, commandName) => {
      if (this._isToolVisible(commandName, commandState)) {
        isVisible = true
      }
    })
    return isVisible
  }

  render($$) {
    let commandStates = this._getCommandStates()
    let el = $$('div').addClass('sc-tool-group')
    el.addClass('sm-'+this.props.name)
    forEach(commandStates, (commandState, commandName) => {
      if (this._isToolVisible(commandName, commandState)) {
        el.append(
          $$(ToggleTool, {
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
