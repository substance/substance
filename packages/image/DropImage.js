import insertImage from './insertImage'

export default {
  type: 'drop-asset',
  match(params) {
    // Mime-type starts with 'image/'
    let isImage = params.file.type.indexOf('image/') === 0
    return params.type === 'file' && isImage
  },
  drop(tx, params) {
    insertImage(tx, params.file)
  }
}
