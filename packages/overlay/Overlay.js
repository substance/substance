import Toolbox from '../tools/Toolbox'

/*
  A default implementation to render the content for the overlay (aka popup) tools.
*/
class Overlay extends Toolbox {

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
    return 'outline-dark'
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
      let selectionMaxWidth = hints.rectangle.width

      // By default, Overlays are aligned center/bottom to the selection
      this.el.css('top', hints.rectangle.top + hints.rectangle.height)
      let leftPos = hints.rectangle.left + selectionMaxWidth/2 - contentWidth/2
      // Must not exceed left bound
      leftPos = Math.max(leftPos, 0)
      // Must not exceed right bound
      let maxLeftPos = hints.rectangle.left + selectionMaxWidth + hints.rectangle.right - contentWidth
      leftPos = Math.min(leftPos, maxLeftPos)
      this.el.css('left', leftPos)
    }
  }

  getClassNames() {
    return 'sc-overlay'
  }

  getTheme() {
    return 'dark'
  }

  getActiveToolGroupNames() {
    return ['overlay']
  }

}

export default Overlay
