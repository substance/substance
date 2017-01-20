import capitalize from '../../util/capitalize'
import extend from '../../util/extend'
import Component from '../../ui/Component'

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


  ```
  config.addCommand('strong', AnnotationCommand, { nodeType: 'strong' })
  config.addTool('strong', AnnotationTool, {
    target: 'annotations'
  })
  ```
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

    el.append(
      this.renderButton($$)
    )
    return el
  }

  renderButton($$) {
    let Button = this.getComponent('button')
    let btn = $$(Button, {
      icon: this.props.showIcon ? this.props.name : null,
      label: this.props.showLabel ? this.props.name : null,
      hint: this.props.showHint ? this.props.name : null,
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
