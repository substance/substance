import DocumentNode from '../../model/DocumentNode'

class ImageNode extends DocumentNode {

  getImageFile() {
    if (this.imageFile) {
      return this.document.get(this.imageFile)
    }
  }

  getUrl() {
    let imageFile = this.getImageFile()
    if (imageFile) {
      return imageFile.getUrl()
    }
  }
}

ImageNode.schema = {
  type: 'image',
  imageFile: { type: 'file' }
}

export default ImageNode
