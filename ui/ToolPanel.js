import Component from './Component'

class ToolPanel extends Component {

  didMount() {
    this.context.editorSession.onRender(this._onCommandStatesChanged, this)
  }

  dispose() {
    this.context.editorSession.off(this)
  }

  _onCommandStatesChanged(editorSession) {
    if (editorSession.hasChanged('commandStates')) {
      this.rerender()
    }
  }

  renderEntries($$) {
    let els = []
    this.props.toolPanel.forEach((entry) => {
      let ComponentClass = this.getComponent(entry.type)
      if (!ComponentClass) throw new Error('Toolpanel entry type not found')
      els.push(
        $$(ComponentClass, entry)
      )
    })
    return els
  }

  hasEnabledTools() {
    let entriesContainer = this.refs.entriesContainer
    let entries = entriesContainer.childNodes
    let hasEnabledTools = false
    entries.forEach((entry) => {
      if (entry.hasEnabledTools()) {
        hasEnabledTools = true
      }
    })
    return hasEnabledTools
  }

  getActiveToolGroupNames() {
    throw new Error('Abstract method')
  }

  showDisabled() {
    return false
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

export default ToolPanel
