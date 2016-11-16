import NodeComponent from '../../ui/NodeComponent'

class ImageComponent extends NodeComponent {

  didMount() {
    super.didMount.call(this)
    this.context.editorSession.onRender('document', this._onDocumentChange, this)
  }

  dispose() {
    super.dispose.call(this)
    this.context.editorSession.off(this)
  }

  // TODO: verify if this check is correct and efficient
  _onDocumentChange(change) {
    if (change.isAffected(this.props.node.id) ||
      change.isAffected(this.props.node.imageFile)) {
      this.rerender()
    }
  }

  render($$) {
    let el = super.render($$)
    el.addClass('sc-image')

    el.append(
      $$('img').attr({
        src: this.props.node.getUrl(),
      }).ref('image')
    )

    return el
  }

}

export default ImageComponent
