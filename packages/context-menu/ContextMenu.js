import Toolbox from '../tools/Toolbox'

class ContextMenu extends Toolbox {

  didMount() {
    super.didMount()
    if (!this.context.scrollPane) {
      throw new Error('Requires a scrollPane context')
    }
    this.context.scrollPane.on('context-menu:opened', this._onContextMenuOpened, this)
  }

  dispose() {
    super.dispose()
    this.context.scrollPane.off(this)
  }

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
    return ['context-menu-primary', 'context-menu-document']
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

  hide() {
    this.el.addClass('sm-hidden')
  }

  /*
    Positions the content menu relative to the scrollPane
  */
  _onContextMenuOpened(hints) {
    let mouseBounds = hints.mouseBounds
    this.el.removeClass('sm-hidden')
    let contextMenuWidth = this.el.htmlProp('offsetWidth')

    // By default, context menu are aligned left bottom to the mouse coordinate clicked
    this.el.css('top', mouseBounds.top)
    let leftPos = mouseBounds.left
    // Must not exceed left bound
    leftPos = Math.max(leftPos, 0)
    // Must not exceed right bound
    let maxLeftPos = mouseBounds.left + mouseBounds.right - contextMenuWidth
    leftPos = Math.min(leftPos, maxLeftPos)
    this.el.css('left', leftPos)
  }
}

export default ContextMenu
