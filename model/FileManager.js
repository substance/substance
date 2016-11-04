import BlobAdapter from './BlobAdapter'

/*
  Storage for files such as images and other assets.

  This accumulates files created or loaded during a session
  so that it is possible to pick up a file after undo+redo.
*/
class FileManager {

  constructor() {
    this.adapters = {}
  }

  storeFile(fileNode) {
    let adapter = this.adapters[fileNode.id]
    // don't adapt the file if we already have it
    if (!adapter) {
      adapter = this.createFileAdapter(fileNode)
      this.adapters[fileNode.id] = adapter
    }
    return adapter
  }

  createFileAdapter(fileNode) { // eslint-disable-line
    throw new Error('This method is abstract.')
  }

  getAdapter(fileNode) {
    return this.adapters[fileNode.id]
  }
}

FileManager.Stub = class Stub extends FileManager {
  constructor() {
    super()
  }

  storeFile(fileNode) {
    let adapter = this.adapters[fileNode.id]
    // don't adapt the file if we already have it
    if (!adapter) {
      adapter = this.createFileAdapter(fileNode)
      this.adapters[fileNode.id] = adapter
    }
    return adapter
  }

  createFileAdapter(fileNode) {
    return new BlobAdapter(fileNode)
  }

}

export default FileManager