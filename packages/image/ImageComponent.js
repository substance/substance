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

  /* Custom dropzone protocol */
  getDropzoneSpecs() {
    return [
      {
        component: this.refs['image'],
        message: 'Replace Image',
        dropParams: {
          action: 'replace-image',
          nodeId: this.props.node.id,
        }
      }
    ]
  }

  handleDrop(tx, dragState) {
    let newImageFile = dragState.data.files[0]
    if (dragState.external) {
      let imageFile = tx.create({
        type: 'file',
        fileType: 'image',
        mimeType: newImageFile.type,
        url: URL.createObjectURL(newImageFile)
      })
      // TODO: we should delete the old image file if there are no
      // referenecs to it anymore
      tx.set([this.props.node.id, 'imageFile'], imageFile.id)
    } else {
      let nodeId = dragState.sourceSelection.nodeId
      let node = tx.get(nodeId)
      if (node.type === 'image') {
        // Use the same filenode as the dragged source node
        tx.set([this.props.node.id, 'imageFile'], node.imageFile)
      }
    }


  }

}

export default ImageComponent
