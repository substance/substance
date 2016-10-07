import DocumentNode from '../../model/DocumentNode'

class Image extends DocumentNode {}

Image.define({
  type: "image",
  src: { type: "string", default: "http://" },
  previewSrc: { type: "string", optional: true }
})

export default Image
