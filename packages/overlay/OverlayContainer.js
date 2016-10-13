import Component from '../../ui/Component'

/*
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
    let el = $$('div').addClass('sc-overlay-container sm-hidden')
    let commandStates = this.context.commandManager.getCommandStates()
    let ComponentClass = this.props.overlay
    el.append($$(ComponentClass, {
      commandStates: commandStates
    }).ref('overlayContent'))
    return el
  }

  didMount() {
    const doc = this.context.documentSession.getDocument()
    this.context.flow.subscribe({
      stage: 'render',
      resources: {
        commandStates: [doc.id, 'commandStates']
      },
      handler: this._onCommandStatesUpdate,
      owner: this
    })
  }

  dispose() {
    this.context.flow.unsubscribe(this)
  }

  position(hints) {
    let content = this.refs.overlayContent
    if (content.isVisible()) {
      this._position(hints);
      this.el.removeClass('sm-hidden')
    }
  }

  _onCommandStatesUpdate() {
    this.rerender()
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
