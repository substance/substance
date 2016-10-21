import Toolbox from '../tools/Toolbox'

class ContextMenu extends Toolbox {

  /*
    Override with custom rendering
  */
  render($$) {
    let el = $$('div').addClass('sc-context-menu sm-hidden')
    let activeToolGroups = this.state.activeToolGroups

    activeToolGroups.forEach((toolGroup) => {
      let toolGroupProps = Object.assign({}, toolGroup, {
        toolStyle: this.getToolStyle(),
        showLabels: true,
        // showHints: true
      })

      if (toolGroupProps.tools.size > 0) {
        let toolGroupEl = $$(toolGroup.Class, toolGroupProps)
        el.append(toolGroupEl)
      }
    })
    return el
  }

  getActiveToolGroupNames() {
    return ['context-menu-spell-check', 'context-menu-document']
  }

  showDisabled() {
    return true
  }

  /*
    Override if you just want to use a different style
  */
  getToolStyle() {
    return 'plain-dark'
  }

  show(hints) {
    this.el.removeClass('sm-hidden')
    this._position(hints)
  }

  hide() {
    this.el.addClass('sm-hidden')
  }

  _position(hints) {
    if (hints) {
      let contentWidth = this.el.htmlProp('offsetWidth')

      // By default, context menu are aligned left bottom to the mouse coordinate clicked
      this.el.css('top', hints.top)
      let leftPos = hints.left
      // Must not exceed left bound
      leftPos = Math.max(leftPos, 0)
      // Must not exceed right bound
      let maxLeftPos = hints.left + hints.right - contentWidth
      leftPos = Math.min(leftPos, maxLeftPos)
      this.el.css('left', leftPos)
    }
  }
}

export default ContextMenu
