/*
  A FileProxy represents a proxy from a FileNode to the real resource.
  As real resources may need to be fetched, the FileProxy typicall has
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
  triggerUpdate() {
    let fileId = this.fileNode.id
    this.context.editorSession.transaction((tx) => {
      tx.set([fileId, '__changed__'], '')
    }, { history: false })
  }
  getUrl() {
    return ""
  }
  sync() {
    return Promise.resolve()
  }
}

FileProxy.match = function(fileNode, context) { // eslint-disable-line
  return false
}

export default FileProxy