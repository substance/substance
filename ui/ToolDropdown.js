import ToolGroup from './ToolGroup'
import Menu from './Menu'
import Tooltip from './tooltip'
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
    let Button = this.getComponent('button')
    let commandStates = this._getCommandStates()
    let el = $$('div').addClass('sc-tool-dropdown')
    el.addClass('sm-'+this.props.name)
    let activeCommandName = this._getActiveCommandName(commandStates)

    if (this.hasEnabledTools(commandStates)) {
      let toggleButton
      if (this.props.style === 'minimal') {
        toggleButton = $$(Button, {
          icon: activeCommandName,
          dropdown: true,
          active: this.state.showChoices,
          theme: this.props.theme
        }).on('click', this._toggleChoices)
      } else if (this.props.style === 'descriptive') {
        toggleButton = $$(Button, {
          label: activeCommandName,
          dropdown: true,
          active: this.state.showChoices,
          theme: this.props.theme
        }).on('click', this._toggleChoices)
      } else {
        throw new Error('Style '+this.props.style+' not supported')
      }

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
      } else {
        let tooltipText = this._getTooltipText()
        if (tooltipText) {
          el.append(
            $$(Tooltip, {
              name: tooltipText
            })
          )
        }
      }
    }
    return el
  }

  _getTooltipText() {
    return this.context.labelProvider.getLabel(this.props.name)
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
