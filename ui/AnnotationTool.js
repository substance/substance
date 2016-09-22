import Tool from '../packages/tools/Tool'

/*
 * Abstract class for annotation tools like StrongTool, EmphasisTool, LinkTool.
 *
 * @component
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
