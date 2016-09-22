import Component from './Component'

/**
  OverlayContainer component

  Used internally by surface to place overlay relative to selection/cursor

  @class
  @component
*/
class OverlayContainer extends Component { 
  constructor(...args) {
    super(...args)

    this.commandStates = this._getCommandStates()
  }

  render($$) {
    let el = $$('div').addClass('sc-overlay sm-hidden')
    let commandStates = this.context.commandManager.getCommandStates()
    let ComponentClass = this.props.overlay
    el.append($$(ComponentClass, {
      commandStates: commandStates
    }).ref('overlayContent'))
    return el
  }

  didMount() {
    // rerender the overlay content after anything else has been updated
    this.context.documentSession.on('didUpdate', this._onSessionDidUpdate, this)
  }

  dispose() {
    this.context.documentSession.off(this)
  }

  position(hints) {
    let content = this.refs.overlayContent
    if (content.childNodes.length > 0) {
      // Position based on rendering hints
      this._position(hints);
      this.el.removeClass('sm-hidden')
    }
  }

  _onSessionDidUpdate() {
    if (this.shouldRerender()) {
      this.rerender()
    }
  }

  _getCommandStates() {
    return this.context.commandManager.getCommandStates()
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
}

export default OverlayContainer
