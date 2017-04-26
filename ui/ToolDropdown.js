import ToolGroup from './ToolGroup'
import Menu from './Menu'
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
        dropdown: true,
        active: this.state.showChoices,
        theme: 'dark' // TODO: use property
      }).on('click', this._toggleChoices)
      el.append(toggleButton)
      if (this.state.showChoices) {
        el.append(
          $$('div').addClass('se-choices').append(
            $$(Menu, {
              commandStates: commandStates,
              items: this._getMenuItems(commandStates)
            })
          )
        )
      }
    }
    return el
  }

  /*
    Turn commandStates into menu items
  */
  _getMenuItems(commandStates) {
    let menuItems = []
    forEach(commandStates, (commandState, commandName) => {
      menuItems.push({
        command: commandName
      })
    })
    return menuItems
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
