import isString from '../util/isString'

class BlobAdapter {

  constructor(fileData) {
    this.id = fileData.id

    // EXPERIMENTAL
    let data = fileData.data
    if (isString(data)) {
      this._url = data
    } else if (data instanceof File) {
      this._file = data
    } else if (data instanceof Blob) {
      this._blob = data
    } else {
      throw new Error('Unsupported file type.')
    }
  }

  getUrl() {
    if (this._file) {
      return URL.createObjectURL(this._file);
    } else if (this._blob) {
      return URL.createObjectURL(this._blob);
    } else if (this._url) {
      return this._url
    }
    return ""
  }
}

export default BlobAdapter