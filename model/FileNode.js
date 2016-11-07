import DocumentNode from './DocumentNode'

class FileNode extends DocumentNode {

  getUrl() {
    if (this.proxy) {
      return this.proxy.getUrl()
    } else {
      // this happens if no FileProxy is attached
      return ""
    }
  }

  setProxy(proxy) {
    this.proxy = proxy
  }
}

FileNode.type = 'file'
FileNode.define({
  fileType: { type: 'string', optional:true },
  mimeType: { type: 'string', optional:true },
  data: { type: 'object', optional:true }
})

FileNode.strip = function(nodeData) {
  return {
    type: nodeData.type,
    id: nodeData.id,
    fileType: nodeData.fileType,
    mimeType: nodeData.mimeType
  }
}

FileNode.prototype._isFileNode = true
FileNode._isFileNode = true

export default FileNode