import startsWith from 'lodash/startsWith'
import insertImageFromFile from './insertImageFromFile'

// Implements a file drop handler
class DropImage {
  match(params) {
    return startsWith(params.file.type, 'image')
  }

  handle(tx, params) {
    insertImageFromFile(tx, params.file)
  }
}

export default DropImage