import FileProxy from '../../model/FileProxy'

class ImageProxy extends FileProxy {

  constructor(fileNode, context) {
    super(fileNode, context)

    // used locally e.g. after drop or file dialog
    this.file = fileNode.data
    if (this.file) {
      this._fileUrl = URL.createObjectURL(this.file)
    }
    this.url = fileNode.url
  }

  getUrl() {
    // if we have fetched the url already, just serve it here
    if (this.url) {
      return this.url
    }
    // if we have a local file, use it's data URL
    if (this._fileUrl) {
      return this._fileUrl
    }
    // no URL available
    return ""
  }

  sync(cb) {
    this.context.fileService.uploadFile(this.file, cb)
  }
}

// to detect that this class should take responsibility for a fileNode
ImageProxy.match = function(fileNode) {
  return fileNode.fileType === 'image'
}

export default ImageProxy