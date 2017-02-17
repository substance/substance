import forEach from '../util/forEach'
import map from '../util/map'

/*
  Storage for files such as images and other assets.

  This accumulates files created or loaded during a session
  so that it is possible to pick up a file after undo+redo.
*/
class FileManager {

  constructor(editorSession, extensions, context) {
    this.editorSession = editorSession
    this.extensions = extensions
    this.proxies = {}
    this.context = context

    // adapt all existing files
    forEach(editorSession.getDocument().getNodes(), (node) => {
      if (node._isFileNode) this.storeFile(node)
    })

    this.editorSession.onUpdate('document', this._onDocumentChange, this)
  }

  dispose() {
    this.editorSession.off(this)
  }

  storeFile(fileNode) {
    let proxy = this.proxies[fileNode.id]
    // don't adapt the file if we already have it
    if (!proxy) {
      proxy = this.createFileProxy(fileNode)
      if (proxy) {
        this.proxies[fileNode.id] = proxy
      }
    }
    fileNode.proxy = proxy
    return proxy
  }

  createFileProxy(fileNode) { // eslint-disable-line
    let context = this.context
    for (var i = 0; i < this.extensions.length; i++) {
      let ExtClass = this.extensions[i]
      if (ExtClass.match(fileNode, context)) {
        return new ExtClass(fileNode, context)
      }
    }
    console.error('No file adapter found for ', fileNode)
  }

  getProxy(fileNode) {
    return this.proxies[fileNode.id]
  }

  sync() {
    // Note: potentially this could be a bi-directional sync
    // ATM, we only consider upload
    let promises = map(this.proxies, (proxy) => {
      return proxy.sync()
    })
    return Promise.all(promises)
  }

  _onDocumentChange(change) {
    let doc = this.editorSession.getDocument()
    forEach(change.created, (nodeData) => {
      // we would need the real node to support inheritance
      let node = doc.get(nodeData.id)
      if (node._isFileNode) {
        this.storeFile(node)
      }
    })
  }
}

export default FileManager