import Component from '../ui/Component'
import forEach from '../util/forEach'
import ToggleTool from './DeprecatedToggleTool'
import MenuItem from './DeprecatedMenuItem'

/*
  Tools rendered in flat tool group

  ```
  $$(ToolGroup, {
    name: 'annotations',
    contextual: true,
    showDisabled: true,
    style: 'minimal', // icon only display
    theme: 'light',
    commandGroups: ['text-types']
  })
  ```
*/
export default class DeprecatedToolGroup extends Component {
  /*
    Determine wether a tool should be shown or not
  */
  isToolEnabled (commandName, commandState) {
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
  hasEnabledTools (commandStates) {
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

  render ($$) {
    let commandStates = this._getCommandStates()
    let el = $$('div').addClass(this._getClassNames())
    el.addClass('sm-' + this.props.name)
    forEach(commandStates, (commandState, commandName) => {
      if (this.isToolEnabled(commandName, commandState) || this.props.showDisabled) {
        let ToolClass = this._getToolClass(commandName)
        el.append(
          $$(ToolClass, {
            name: commandName,
            commandState: commandState,
            style: this.props.style,
            theme: this.props.theme
          }).ref(commandName)
        )
      }
    })
    return el
  }

  /*
    We map an array of command groups to array command states
  */
  _getCommandStates () {
    let commandStates = this.context.editorSession.getCommandStates()
    let commandGroups = this.context.commandGroups
    let filteredCommandStates = {} // command states objects of that group
    this.props.commandGroups.forEach((commandGroup) => {
      // Note: as commandGroups and toolbars are defined
      // separatedly, I prefer not to throw here
      if (!commandGroups[commandGroup]) {
        // throw new Error('commandGroup "'+commandGroup+'" not found')
        return
      }
      commandGroups[commandGroup].forEach((commandName) => {
        // in Stencila we are having mulitple EditorSessions
        // with different set of commands. As we have only one definition
        // for the toolgroup we need to make sure the command state is available
        // TODO: Solve this. In Texture this is working because there are always all command states
        // defined, only disabled contextually.
        if (commandStates[commandName]) {
          filteredCommandStates[commandName] = commandStates[commandName]
        }
      })
    })
    return filteredCommandStates
  }

  _getClassNames () {
    return 'sc-tool-group'
  }

  _getToolClass (commandName) {
    let tools = this.context.tools
    let DefaultToolClass
    if (this.props.style === 'descriptive') {
      DefaultToolClass = MenuItem
    } else {
      DefaultToolClass = ToggleTool
    }
    return tools[commandName] || DefaultToolClass
  }
}
