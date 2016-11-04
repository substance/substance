import DocumentNode from './DocumentNode'

class FileNode extends DocumentNode {

  getUrl() {
    if (this.adapter) {
      return this.adapter.getUrl()
    } else {
      return ""
    }
  }

  setAdapter(adapter) {
    this.adapter = adapter
  }
}

FileNode.type = 'file'
FileNode.define({
  mimeType: { type: 'string', optional:true },
})

FileNode.strip = function(nodeData) {
  return {
    type: nodeData.type,
    id: nodeData.id,
    mimeType: nodeData.mimeType
  }
}

export default FileNode