import Component from '../ui/Component'

export default class DeprecatedToolPanel extends Component {
  didMount () {
    this.context.editorSession.onRender('commandStates', this._onCommandStatesChanged, this)
  }

  dispose () {
    this.context.editorSession.off(this)
  }

  render($$) { // eslint-disable-line
    throw new Error('This method is abstract')
  }

  /*
    Defines the components used to render certain entry types

    Override to customize.
  */
  getEntryTypeComponents () {
    return {
      'tool-group': this.getComponent('tool-group'),
      'tool-dropdown': this.getComponent('tool-dropdown'),
      'tool-prompt': this.getComponent('tool-prompt'),
      'tool-separator': this.getComponent('tool-separator')
    }
  }

  renderEntries ($$) {
    return this.props.toolPanel.map(entry => {
      let entryTypeComponents = this.getEntryTypeComponents()
      let ComponentClass = entryTypeComponents[entry.type]
      if (!ComponentClass) throw new Error('Toolpanel entry type not found')
      let props = Object.assign({}, entry, { theme: this.getTheme() })
      let el = $$(ComponentClass, props)
      if (entry.name) el.ref(entry.name)
      return el
    })
  }

  hasEnabledTools () {
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

  getActiveToolGroupNames () {
    throw new Error('Abstract method')
  }

  showDisabled () {
    return false
  }

  /*
    Override if you just want to use a different style
  */
  getToolStyle () {
    throw new Error('Abstract method')
  }

  getTheme () {
    return this.props.theme || 'dark'
  }

  _onCommandStatesChanged () {
    this.rerender()
  }
}
