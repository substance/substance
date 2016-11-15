import startsWith from 'lodash/startsWith'
import insertImageFromFile from './insertImageFromFile'
import DragAndDropHandler from '../../ui/DragAndDropHandler'

// Implements a file drop handler
class DropImage extends DragAndDropHandler {
  match(params) {
    console.log('match', params)
    return params.type === 'file' && startsWith(params.file.type, 'image')
  }

  drop(tx, params) {
    console.info('handling image file')
    insertImageFromFile(tx, params.file)
  }
}

export default DropImage