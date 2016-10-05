import Tool from '../packages/tools/Tool'

/**

  Reuseable AnnotationTool component. Can be used without modification
  for pure marker annotations that don't carry data. E.g. strong, emphasis,
  superscript, etc.

  @class
  @component

  @example

  ```
  config.addTool('strong', AnnotationTool, {
    target: 'annotations'
  })
  ```
*/

class AnnotationTool extends Tool {

  render($$) {
    let el = super.render.call(this, $$)
    el.addClass('sm-annotation-tool')
    return el
  }

  renderButton($$) {
    let el = super.renderButton.call(this, $$)
    el.append(this.renderMode($$))
    return el
  }

  /*
    Renders a small hint for the mode (expand, truncate, edit, etc)
  */
  renderMode($$) {
    let mode = this.props.mode
    let el = $$('div').addClass('se-mode')

    let iconEl = this.context.iconProvider.renderIcon($$, mode)
    if (iconEl) {
      el.append(iconEl)
    }
    return el
  }
}

export default AnnotationTool
