import DocumentNode from '../../model/DocumentNode'

class FileNode extends DocumentNode {

  constructor(...args) {
    super(...args)
  }

  getUrl() {
    if (this.proxy) {
      return this.proxy.getUrl()
    } else {
      // this happens if no FileProxy is attached
      console.warn('No file proxy attached to ', this.id)
      return ''
    }
  }

  setProxy(proxy) {
    this.proxy = proxy
  }
}

FileNode.type = 'file'

FileNode.schema = {
  url: { type: 'string', optional: true },
  fileType: { type: 'string', optional: true },
  mimeType: { type: 'string', optional: true },
  sourceFile: { type: 'object', optional: true }
}

FileNode.prototype._isFileNode = true
FileNode._isFileNode = true

export default FileNode
