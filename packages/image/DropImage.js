import insertImage from './insertImage'
import DragAndDropHandler from '../../ui/DragAndDropHandler'

class DropImage extends DragAndDropHandler {
  match(params) {
    // Mime-type starts with 'image/'
    let isImage = params.file.type.indexOf('image/') === 0
    return params.type === 'file' && isImage
  }

  drop(tx, params) {
    insertImage(tx, params.file)
  }
}

export default DropImage
