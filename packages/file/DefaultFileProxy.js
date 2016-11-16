import FileProxy from '../../model/FileProxy'

/*
  Generic implementation of a file proxy that works with
  any file type
*/
class DefaultFileProxy extends FileProxy {

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

export default DefaultFileProxy