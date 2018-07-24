import Component from '../ui/Component'
import Tooltip from '../ui/Tooltip'

/**
  Default Tool implementation

  A tool must be associated with a Command, which holds all the logic, while the tool
  is just the visual representation of the command state. You can use this component
  for simple button-like tools, or extend it to create your own UI.

  @example

  Usually instantiated in a Toolbar or an Overlay. Usage:
*/
export default class DeprecatedToggleTool extends Component {
  /**
    Default tool rendering. You can override this method to provide your custom markup
  */
  render ($$) {
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
        text: this._getTooltipText()
      })
    )
    return el
  }

  renderButton ($$) {
    let commandState = this.props.commandState
    let Button = this.getComponent('button')
    let btn = $$(Button, {
      icon: this.getIconName(),
      active: commandState.active,
      disabled: commandState.disabled,
      theme: this.props.theme
    }).on('click', this.onClick)
    return btn
  }

  getClassNames () {
    return ''
  }

  getCommandName () {
    return this.getName()
  }

  getName () {
    return this.props.name
  }

  getIconName () {
    return this.props.name
  }

  onClick (e) {
    e.preventDefault()
    e.stopPropagation()
    if (!this.props.disabled) {
      this.executeCommand()
    }
  }

  _getTooltipText () {
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
  executeCommand (props) {
    props = Object.assign({ mode: this.props.mode }, props)
    this.context.commandManager.executeCommand(this.getCommandName(), props)
  }

  get _isTool () { return true }
}
