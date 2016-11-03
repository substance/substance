import DocumentNode from './DocumentNode'

class FileNode extends DocumentNode {

  constructor(...args) {
    super(...args)

    this.fileAdapter = this.getDocument()._getFileStore().getAdapter(this)
    if (!this.fileAdapter) {
      throw new Error('Could not find file.')
    }
  }

  getUrl() {
    return this.fileAdapter.getUrl()
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