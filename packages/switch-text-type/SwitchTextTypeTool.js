import forEach from '../../util/forEach'
import Tool from '../tools/Tool'
import keys from '../../util/keys'

/**
  SwitchTextTypeTool. Implements the SurfaceTool API.

  @class
  @component
*/
class SwitchTextTypeTool extends Tool {
  constructor(...args) {
    super(...args)

    // cursor for keyboard navigation
    this._navIdx = -1
  }

  // UI Specific parts
  // ----------------

  didMount(...args) {
    super.didMount(...args)
    this._focusToggle()
  }

  render($$) {
    let labelProvider = this.context.labelProvider
    let textTypeName = 'No selection'

    if (this.props.currentTextType) {
      textTypeName = this.props.currentTextType.name
    }
    let el = $$('div').addClass('sc-switch-text-type')

    let toggleButton = $$('button').ref('toggle')
      .addClass('se-toggle')
      .attr('title', labelProvider.getLabel('switch_text'))
      .append(labelProvider.getLabel(textTypeName))
      .on('click', this.toggleAvailableTextTypes)

    if (this.props.disabled || !this.props.currentTextType) {
      el.addClass('sm-disabled');
      toggleButton.attr('tabindex', -1)
    } else {
      toggleButton.attr('tabindex', 1)
    }

    el.append(toggleButton)

    if (this.state.open) {
      el.addClass('sm-open')

      // dropdown options
      let options = $$('div').addClass("se-options").ref('options')
      forEach(this.props.textTypes, function(textType) {
        let button = $$('button')
            .addClass('se-option sm-'+textType.name)
            .attr('data-type', textType.name)
            .append(labelProvider.getLabel(textType.name))
            .on('click', this.handleClick)
        options.append(button)
      }.bind(this))
      el.append(options)
      el.on('keydown', this.onKeydown)
    }

    return el
  }

  didUpdate() {
    this._focusToggle()
  }

  _focusToggle() {
    if (this.state.open) {
      this.refs.toggle.el.focus()
    }
  }

  executeCommand(textType) {
    this.context.commandManager.executeCommand(this.getCommandName(), {
      textType: textType
    })
  }

  getTextCommands() {
    let surface = this.getSurface()
    if (!this.textCommands && surface) {
      this.textCommands = surface.getTextCommands()
    }
    return this.textCommands || {}
  }

  handleClick(e) {
    e.preventDefault()
    // Modifies the tool's state so that state.open is undefined, which is nice
    // because it means the dropdown will be closed automatically
    this.executeCommand(e.currentTarget.dataset.type)
  }

  onKeydown(event) {
    let handled = false
    switch (event.keyCode) {
      case keys.UP:
        this._nav(-1)
        handled = true
        break
      case keys.DOWN:
        this._nav(1)
        handled = true
        break
      case keys.ESCAPE:
        this.toggleDropdown()
        handled = true
        break
      default:
        // nothing
    }
    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  toggleAvailableTextTypes(e) {
    e.preventDefault()
    e.stopPropagation()
    if (this.props.disabled) return

    // HACK: This only updates the view state state.open is not set on the tool itself
    // That way the dropdown automatically closes when the selection changes
    this.toggleDropdown()
  }

  toggleDropdown() {
    // reset index for keyboard navigation
    this._navIdx = -1
    this.extendState({
      open: !this.state.open
    })
  }

  _nav(step) {
    this._navIdx += step
    this._navIdx = Math.max(0, this._navIdx)
    this._navIdx = Math.min(this._getOptionsCount()-1, this._navIdx)

    if (this._navIdx >= 0) {
      let option = this.refs.options.children[this._navIdx]
      option.focus()
    }
  }

  _getOptionsCount() {
    return this.refs.options.children.length
  }

}

SwitchTextTypeTool.command = 'switch-text-type'

export default SwitchTextTypeTool
