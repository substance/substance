import DefaultFileProxy from '../file/DefaultFileProxy'

class ImageProxy extends DefaultFileProxy {}

// to detect that this class should take responsibility for a fileNode
ImageProxy.match = function(fileNode) {
  return fileNode.fileType === 'image'
}

export default ImageProxy