import Toolbox from '../tools/Toolbox'

/*
  A default implementation to render the content for the overlay (aka popup) tools.
*/
class Gutter extends Toolbox {

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
      // By default, gutter is centered (y-axis) and left of the scrollPane content (x-axis)
      this.el.css('top', hints.rectangle.top + hints.rectangle.height - hints.rectangle.height / 2)
      this.el.css('left', 0)
    }
  }

  getClassNames() {
    return 'sc-gutter'
  }

  getTheme() {
    return 'dark'
  }

  getActiveToolGroupNames() {
    return ['gutter']
  }

}

export default Gutter
