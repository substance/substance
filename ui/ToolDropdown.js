import ToolGroup from './ToolGroup'
import Menu from './Menu'
import Tooltip from './Tooltip'
import forEach from '../util/forEach'

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
  willReceiveProps () {
    this.setState({showChoices: false})
  }

  render ($$) {
    let Button = this.getComponent('button')
    let commandStates = this._getCommandStates()
    let el = $$('div').addClass('sc-tool-dropdown')
    el.addClass('sm-' + this.props.name)

    // Used to resolve icon / label
    const toggleName = this._getToggleName(commandStates) || this.props.name

    // Only render this if there are enabled tools
    // except if the user decided to show disabled commands
    if (this.props.showDisabled || this.hasEnabledTools(commandStates)) {
      let toggleButton
      if (this.props.style === 'minimal') {
        toggleButton = $$(Button, {
          icon: toggleName,
          dropdown: true,
          active: this.state.showChoices,
          theme: this.props.theme
        }).on('click', this._toggleChoices)
      } else if (this.props.style === 'descriptive') {
        toggleButton = $$(Button, {
          label: toggleName,
          // HACK: this allows tool buttons to render labels with template strings
          commandState: commandStates[toggleName],
          dropdown: true,
          active: this.state.showChoices,
          theme: this.props.theme
        }).on('click', this._toggleChoices)
      } else {
        throw new Error('Style ' + this.props.style + ' not supported')
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
      } else if (this.props.style === 'minimal' || toggleName !== this.props.name) {
        // NOTE: tooltips are only rendered when explanation is needed
        el.append(
          this._renderToolTip($$)
        )
      }
    }
    return el
  }

  _renderToolTip ($$) {
    let labelProvider = this.context.labelProvider
    return $$(Tooltip, {
      text: labelProvider.getLabel(this.props.name)
    })
  }

  /*
    This can be overridden to control the label
  */
  _getToggleName (commandStates) {
    return this._getActiveCommandName(commandStates)
  }

  /*
    Turn commandStates into menu items
  */
  _getMenuItems (commandStates) {
    const showDisabled = this.props.showDisabled
    let menuItems = []
    forEach(commandStates, (commandState, commandName) => {
      // ATTENTION: not showing the disabled ones is violating the users choice
      // given via configuration 'showDisabled'
      if (showDisabled || this.isToolEnabled(commandName, commandState)) {
        menuItems.push({
          command: commandName
        })
      }
    })
    return menuItems
  }

  _getActiveCommandName (commandStates) {
    let activeCommand

    forEach(commandStates, (commandState, commandName) => {
      if (commandState.active && !activeCommand) {
        activeCommand = commandName
      }
    })
    return activeCommand
  }

  _toggleChoices () {
    this.setState({
      showChoices: !(this.state.showChoices)
    })
  }
}

export default ToolDropdown
