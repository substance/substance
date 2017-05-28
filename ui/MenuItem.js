import Component from './Component'

/*

  ```
  $$(MenuItem, {
    name: 'strong',
    commandState: { active, disabled }
  })
  ```
*/
class MenuItem extends Component {

  render($$) {
    let commandState = this.props.commandState
    let el = $$('button')
      .addClass('sc-menu-item')
      .append(
        this._renderIcon($$),
        this._renderLabel($$),
        this._renderKeyboardShortcut($$)
      )
      .on('click', this._onClick)

    if (this.props.label) {
      el.append(this.renderLabel($$))
    }
    if (commandState.active) {
      el.addClass('sm-active')
    }
    if (commandState.disabled) {
      // make button inaccessible
      el.attr('tabindex', -1)
        .attr('disabled', true)
    } else {
      // make button accessible for tab-navigation
      el.attr('tabindex', 1)
    }
    return el
  }

  _renderLabel($$) {
    return $$('div').addClass('se-label').append(
      this._getLabel()
    )
  }

  _renderIcon($$) {
    return $$('div').addClass('se-icon').append(
      this.context.iconProvider.renderIcon($$, this.props.name)
    )
  }

  _renderKeyboardShortcut($$) {
    return $$('div').addClass('se-keyboard-shortcut').append(
      this._getKeyboardShortcut()
    )
  }

  _getLabel() {
    let labelProvider = this.context.labelProvider
    return labelProvider.getLabel(this.props.name)
  }

  _getKeyboardShortcut() {
    let name = this.props.name
    let keyboardShortcuts = this.context.keyboardShortcuts
    if (keyboardShortcuts[name]) {
      return keyboardShortcuts[name]
    } else {
      return ''
    }
  }

  _onClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!this.props.commandState.disabled) this.executeCommand()
  }

  /*
    Executes the associated command
  */
  executeCommand(props) {
    // props = Object.assign({ mode: this.props.mode }, props)
    this.context.commandManager.executeCommand(this.props.name, props)
  }
}

export default MenuItem
