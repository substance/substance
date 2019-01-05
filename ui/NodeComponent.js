import Component from './Component'

export default class NodeComponent extends Component {
  didMount () {
    this.context.editorSession.onRender('document', this.rerender, this, { path: [this.props.node.id] })
  }

  dispose () {
    this.context.editorSession.off(this)
  }

  render ($$) {
    let tagName = this.getTagName()
    let el = $$(tagName)
      .attr('data-id', this.props.node.id)
      .addClass(this.getClassNames())
    return el
  }

  getTagName () {
    return 'div'
  }

  getClassNames () {
    return ''
  }

  rerender (...args) {
    // HACK: skip if this node has been disposed already
    if (this.props.node.isDisposed()) return

    super.rerender(...args)
  }
}
