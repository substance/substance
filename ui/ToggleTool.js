// import { capitalize } from '../util'
import Component from './Component'
import Tooltip from './Tooltip'

/**
  Default Tool implementation

  A tool must be associated with a Command, which holds all the logic, while the tool
  is just the visual representation of the command state. You can use this component
  for simple button-like tools, or extend it to create your own UI.

  @class
  @component

  @example

  Usually instantiated in a Toolbar or an Overlay. Usage:

  ```
  $$(Tool, {
    icon: 'strong',
    label: 'strong',
    style: 'outline',
    active: false,
    disabled: false
  })
  ```
*/
class ToggleTool extends Component {

  get _isTool() {
    return true
  }

  /**
    Default tool rendering. You can override this method to provide your custom markup
  */
  render($$) {
    let el = $$('div')
      .addClass('sc-toggle-tool')

    let customClassNames = this.getClassNames()
    if (customClassNames) {
      el.addClass(customClassNames)
    }

    el.append(
      this.renderButton($$)
    )

    // Append tooltip
    el.append(
      $$(Tooltip, {
        name: this._getTooltipText()
      })
    )
    return el
  }


  renderButton($$) {
    let commandState = this.props.commandState
    let Button = this.getComponent('button')
    let btn = $$(Button, {
      icon: this.props.name,
      active: commandState.active,
      disabled: commandState.disabled,
      theme: 'dark' // TODO: use property
    }).on('click', this.onClick)
    return btn
  }

  getClassNames() {
    return ''
  }

  /*
    For now always same as tool name
  */
  getCommandName() {
    return this.getName()
  }

  getName() {
    return this.props.name
  }

  onClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!this.props.disabled) this.executeCommand()
  }

  _getTooltipText() {
    let name = this.props.name
    let label = this.context.labelProvider.getLabel(name)
    let keyboardShortcuts = this.context.keyboardShortcuts
    if (keyboardShortcuts[name]) {
      return [label, ' (', keyboardShortcuts[name], ')'].join('')
    } else {
      return label
    }
  }

  /**
    Executes the associated command
  */
  executeCommand(props) {
    props = Object.assign({ mode: this.props.mode }, props)
    this.context.commandManager.executeCommand(this.getCommandName(), props)
  }
}

export default ToggleTool
