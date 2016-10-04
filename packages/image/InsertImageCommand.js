import Command from '../../ui/Command'
import paste from '../../model/transform/paste'

class ImageCommand extends Command {
  constructor() {
    super({ name: 'insert-image' })
  }

  getCommandState(params, context) {
    let documentSession = context.documentSession
    let sel = params.selection || documentSession.getSelection()
    let surface = params.surface || context.surfaceManager.getFocusedSurface()
    let newState = {
      disabled: true,
      active: false
    }
    if (sel && !sel.isNull() && !sel.isCustomSelection() &&
        surface && surface.isContainerEditor()) {
      newState.disabled = false
    }
    return newState
  }

  /**
    Inserts (stub) images and triggers a fileupload.
    After upload has completed, the image URLs get updated.
  */
  execute(params, context) {
    let state = this.getCommandState(params, context)
    // Return if command is disabled
    if (state.disabled) return

    let documentSession = context.documentSession
    let sel = params.selection || documentSession.getSelection()
    let surface = params.surface || context.surfaceManager.getFocusedSurface()
    let fileClient = context.fileClient
    let files = params.files

    // can drop images only into container editors
    if (!surface.isContainerEditor()) return

    // creating a small doc where we add the images
    // and then we use the paste transformation to get this snippet
    // into the real doc
    let doc = surface.getDocument()
    let snippet = doc.createSnippet()

    // as file upload takes longer we will insert stub images
    let items = files.map(function(file) {
      let node = snippet.create({ type: 'image' })
      snippet.show(node)
      return {
        file: file,
        nodeId: node.id
      }
    })

    surface.transaction(function(tx) {
      tx.before.selection = sel
      return paste(tx, {
        selection: sel,
        containerId: surface.getContainerId(),
        doc: snippet
      })
    })

    // start uploading
    items.forEach(function(item) {
      let nodeId = item.nodeId
      let file = item.file
      let node = doc.get(nodeId)
      node.emit('upload:started')
      let channel = fileClient.uploadFile(file, function(err, url) {
        if (err) {
          url = "error"
        }
        // get the node again to make sure it still exists
        let node = doc.get(nodeId)
        if (node) {
          node.emit('upload:finished');
          documentSession.transaction(function(tx) {
            tx.set([nodeId, 'src'], url)
          })
        }
      })
      channel.on('progress', function(progress) {
        // console.log('Progress', progress);
        node.emit('upload:progress', progress)
      })
    })

    return {
      status: 'file-upload-process-started'
    }
  }

}

export default ImageCommand
