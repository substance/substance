import DocumentNode from '../../model/DocumentNode'

class Image extends DocumentNode {

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

Image.define({
  type: 'image',
  imageFile: { type: 'file' }
})

export default Image
