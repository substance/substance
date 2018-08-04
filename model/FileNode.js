import DocumentNode from './DocumentNode'

export default class FileNode extends DocumentNode {
  getUrl () {
    if (this.proxy) {
      return this.proxy.getUrl()
    } else {
      // this happens if no FileProxy is attached
      console.warn('No file proxy attached to ', this.id)
      return ''
    }
  }

  setProxy (proxy) {
    this.proxy = proxy
  }

  // TODO: do we really need this?
  get _isFileNode () { return true }

  static get _isFileNode () { return true }
}

FileNode.schema = {
  type: 'file',
  url: { type: 'string', optional: true },
  fileType: { type: 'string', optional: true },
  mimeType: { type: 'string', optional: true },
  sourceFile: { type: 'object', optional: true }
}
