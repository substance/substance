import Component from './Component'

class Toolbox extends Component {

  getInitialState() {
    return {
      activeToolGroups: this.getActiveToolGroups()
    }
  }

  // NOTE: We disable this, as it is premature optimization and can cause
  // side effects. Rendering the toolbox always is not a big performance
  // issue atm.
  // shouldRerender(newProps, newState) {
  //   // poor-man's immutable style
  //   let hasChanged = !isEqual(this.props, newProps) || !isEqual(this.state.activeToolGroups, newState.activeToolGroups)
  //
  //   if (!hasChanged) {
  //     this.hide()
  //     return false
  //   }
  //   return true
  // }

  didMount() {
    // rerender the context menu after anything else has been updated
    this.context.editorSession.onRender(this._onCommandStatesChanged, this)
  }

  dispose() {
    this.context.editorSession.off(this)
  }

  _onCommandStatesChanged(editorSession) {
    let activeToolGroups = this.getActiveToolGroups()
    if (editorSession.hasChanged('commandStates')) {
      this.setState({
        activeToolGroups: activeToolGroups
      })
    }
  }

  /*
    Returns A map of tooltargets, the value being an array of tool objects
    containing Class and toolProps for rendering
  */
  getActiveToolGroups() {
    this._hasActiveTools = false

    let toolGroups = this.context.toolGroups
    let activeToolGroupNames = this.getActiveToolGroupNames()
    let activeToolGroups = new Map()

    activeToolGroupNames.forEach((toolGroupName) => {
      let toolGroup = toolGroups.get(toolGroupName)
      if (!toolGroup) return
      let tools = toolGroup.tools
      let activeTools = this.getActiveTools(tools, toolGroupName)
      activeToolGroups.set(toolGroupName, {
        name: toolGroupName,
        Class: toolGroup.Class,
        tools: activeTools
      })
    })
    return activeToolGroups
  }

  /*
    For a given Map of tools and a toolGroupName determine
    a set of activeTools, based on the current commandStates
  */
  getActiveTools(tools, toolGroupName) { // eslint-disable-line
    let activeTools = new Map()
    let commandStates = this._getCommandStates()

    tools.forEach((tool, toolName) => {
      let toolProps = Object.assign(
        { disabled: true },
        commandStates[toolName],
        {
          name: toolName,
          label: toolName,
          // style hint only interprerted by generic Tool class
          style: this.getToolStyle(toolName)
        }
      )

      // NOTE: showInContext must be set by commands explicitly in order to have
      // the tool show up in the overlay.
      if ((!toolProps.disabled || this.showDisabled()) && toolProps.showInContext) {
        activeTools.set(tool.name, {
          name: tool.name,
          Class: tool.Class,
          toolProps: toolProps
        })
        this._hasActiveTools = true
      }
    })

    return activeTools
  }

  hasActiveTools() {
    return Boolean(this._hasActiveTools)
  }

  getActiveToolGroupNames() {
    throw new Error('Abstract method')
  }

  showDisabled() {
    return false
  }

  hide() {
    // Optional hook for hiding the toolbox component
  }

  /*
    Override if you just want to use a different style
  */
  getToolStyle() {
    throw new Error('Abstract method')
  }

  _getCommandStates() {
    return this.context.commandManager.getCommandStates()
  }

}

export default Toolbox
