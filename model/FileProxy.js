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

  sync() {
    return Promise.reject(new Error('sync method not implemented'))
  }
}

FileProxy.match = function(fileNode, context) { // eslint-disable-line
  return false
}

export default FileProxy