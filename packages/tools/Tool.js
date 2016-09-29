import capitalize from 'lodash/capitalize'
import extend from 'lodash/extend'
import Button from '../button/Button'
import Component from '../../ui/Component'

/**
  Default Tool implementation

  A tool must be associated with a Command, which holds all the logic, while the tool
  is just the visual representation of the command state.

  @class
  @component
*/
class Tool extends Component {

  get _isTool() {
    return true
  }

  /**
    Default tool rendering. You can override this method to provide your custom markup
  */
  render($$) {
    let el = $$('div')
      .addClass('se-tool')

    let customClassNames = this.getClassNames()
    if (customClassNames) {
      el.addClass(customClassNames)
    }

    let title = this.getTitle()
    if (title) {
      el.attr('title', title)
      el.attr('aria-label', title)
    }

    // Add button
    el.append(
      this.renderButton($$)
    )
    return el
  };

  renderButton($$) {
    let btn = $$(Button, {
      icon: this.props.icon,
      label: this.props.label,
      hint: this.props.hint,
      active: this.props.active,
      disabled: this.props.disabled,
      style: this.props.style
    }).on('click', this.onClick)
    return btn
  }

  getClassNames() {
    return ''
  }

  getTitle() {
    let labelProvider = this.context.labelProvider
    let title = this.props.title || labelProvider.getLabel(this.getName())
    // Used only by annotation tool so far
    if (this.props.mode) {
      title = [capitalize(this.props.mode), title].join(' ')
    }
    return title
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

  /**
    Executes the associated command
  */
  executeCommand(props) {
    this.context.commandManager.executeCommand(this.getCommandName(), extend({
      mode: this.props.mode
    }, props))
  }
}

export default Tool
