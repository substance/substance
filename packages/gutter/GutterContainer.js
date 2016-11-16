import Component from '../../ui/Component'

/*
  GutterContainer component

  Used internally by surface to place the gutter relative to selection/cursor

  @class
  @component
*/
class GutterContainer extends Component {
  constructor(...args) {
    super(...args)
  }

  render($$) {
    let el = $$('div').addClass('sc-gutter-container sm-hidden')
    let gutterEl = this.props.gutter
    // TODO: Assigning a ref for a VirtualElement that gets passed via
    // props does not work. How can we approach this better?
    gutterEl.ref('gutter')
    el.append(gutterEl)
    return el
  }

  didMount() {
    // rerender the overlay content after anything else has been updated
    this.context.editorSession.onRender('commandStates', this.rerender, this)
  }

  dispose() {
    this.context.editorSession.off(this)
  }

  position(hints) {
    // HACK: we navigate the dom as we can't use
    // this.refs.gutter (see comment in render method)
    let gutterEl = this.el.children[0]._comp
    if (gutterEl.isVisible()) {
      this._position(hints);
      this.el.removeClass('sm-hidden')
    }
  }

  _position(hints) {
    if (hints) {
      // By default, gutter is centered (y-axis) and left of the scrollPane content (x-axis)
      this.el.css('top', hints.rectangle.top + hints.rectangle.height - hints.rectangle.height / 2)
      this.el.css('left', 0)
    }
  }
}

export default GutterContainer
