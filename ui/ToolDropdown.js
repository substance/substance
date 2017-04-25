import ToolGroup from './ToolGroup'
import MenuItem from './MenuItem'
import { forEach } from '../util'

/*
  ```
  $$(ToolDropdown, {
    name: 'text-types',
    type: 'tool-dropdown',
    contextual: true,
    style: 'minimal', // icon only display
    commandGroups: ['text-types']
  })
  ```
*/
class ToolDropdown extends ToolGroup {

  /*
    Make sure the dropdown is closed each time we receive new props
  */
  willReceiveProps() {
    this.setState({showChoices: false})
  }

  render($$) {
    let commandStates = this._getCommandStates()
    let el = $$('div').addClass('sc-tool-dropdown')
    el.addClass('sm-'+this.props.name)
    let activeCommandName = this._getActiveCommandName(commandStates)
    let Button = this.getComponent('button')

    if (this._isVisible(commandStates)) {
      // TODO: render arrow indicating a dropdown
      let toggleButton = $$(Button, {
        icon: activeCommandName,
        active: this.state.showChoices,
        theme: 'dark' // TODO: use property
      }).on('click', this._toggleChoices)
      el.append(toggleButton)

      if (this.state.showChoices) {
        let choices = $$('div').addClass('se-choices')
        forEach(commandStates, (commandState, commandName) => {
          if (this._isToolVisible(commandName, commandState)) {
            choices.append(
              $$(MenuItem, {
                name: commandName,
                commandState: commandState
              }).ref(commandName)
            )
          }
        })
        el.append(choices)
      }
    }

    return el
  }

  /*
    Dropdown is only visible if at least one option is present
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

  _getActiveCommandName(commandStates) {
    let activeCommand
    forEach(commandStates, (commandState, commandName) => {
      if (commandState.active && !activeCommand) {
        activeCommand = commandName
      }
    })
    return activeCommand
  }

  _toggleChoices() {
    this.setState({
      showChoices: !(this.state.showChoices)
    })
  }
}

export default ToolDropdown
