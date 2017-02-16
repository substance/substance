import Toolbox from '../tools/Toolbox'

/*
  A default implementation to render the content for the overlay (aka popup) tools.
*/
class Overlay extends Toolbox {

  didMount() {
    super.didMount()
    if (!this.context.scrollPane) {
      throw new Error('Requires scrollPane context')
    }
    this.context.scrollPane.on('selection:positioned', this._onSelectionPositioned, this)
  }

  dispose() {
    super.dispose()
    this.context.scrollPane.off(this)
  }

  render($$) {
    let el = $$('div').addClass(this.getClassNames())
    el.addClass('sm-hidden')
    el.addClass('sm-theme-'+this.getTheme())
    let activeToolGroups = this.state.activeToolGroups
    let activeToolsEl = $$('div').addClass('se-active-tools')

    activeToolGroups.forEach((toolGroup) => {
      let toolGroupProps = Object.assign({}, toolGroup, {
        toolStyle: this.getToolStyle(),
        showIcons: true
      })
      activeToolsEl.append(
        $$(toolGroup.Class, toolGroupProps)
      )
    })

    el.append(activeToolsEl)
    return el
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

  _onSelectionPositioned(hints) {
    if (this.hasActiveTools()) {
      this.el.removeClass('sm-hidden')
      let overlayWidth = this.el.htmlProp('offsetWidth')
      let selRect = hints.selectionRect
      let selectionMaxWidth = selRect.width
      // By default, Overlays are aligned center/bottom to the selection
      this.el.css('top', selRect.top + selRect.height)
      let leftPos = selRect.left + selectionMaxWidth/2 - overlayWidth/2
      // Must not exceed left bound
      leftPos = Math.max(leftPos, 0)
      // Must not exceed right bound
      let maxLeftPos = selRect.left + selectionMaxWidth + selRect.right - overlayWidth
      leftPos = Math.min(leftPos, maxLeftPos)
      this.el.css('left', leftPos)
    } else {
      this.el.addClass('sm-hidden')
    }
  }

  getClassNames() {
    return 'sc-overlay'
  }

  getTheme() {
    return 'dark'
  }

  getActiveToolGroupNames() {
    return this.props.toolGroups || ['overlay']
  }

}

export default Overlay
