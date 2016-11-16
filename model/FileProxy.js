/*
  A FileProxy represents a proxy from a FileNode to the real resource.
  As real resources may need to be fetched, the FileProxy typically has
  multiple internal states.
*/
class FileProxy {
  constructor(fileNode, context) {
    this.fileNode = fileNode
    this.context = context
    fileNode.setProxy(this)
  }

  get id() {
    return this.fileNode.id
  }

  /*
    Fires a property update on the file node
  */
  triggerUpdate() {
    let fileId = this.fileNode.id
    this.context.editorSession.transaction((tx) => {
      tx.set([fileId, '__changed__'], '')
    }, { history: false })
  }

  getUrl() {
    return ''
  }

  /*
    We support both promise and callback API's here
  */
  sync(cb) {
    if (cb) return cb(null)
    return Promise.resolve()
  }
}

FileProxy.match = function(fileNode, context) { // eslint-disable-line
  return false
}

export default FileProxy