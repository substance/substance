import ImageNode from './ImageNode'
import ImageComponent from './ImageComponent'
import ImageHTMLConverter from './ImageHTMLConverter'
import ImageXMLConverter from './ImageXMLConverter'
import InsertImageCommand from './InsertImageCommand'
import InsertImageTool from './InsertImageTool'
import DropImage from './DropImage'
import ImageFileProxy from './ImageFileProxy'

export default {
  name: 'image',
  configure: function(config) {
    config.addNode(ImageNode);
    config.addComponent('image', ImageComponent)
    config.addConverter('html', ImageHTMLConverter)
    config.addConverter('xml', ImageXMLConverter)
    config.addCommand('insert-image', InsertImageCommand)
    config.addTool('insert-image', InsertImageTool)
    config.addIcon('insert-image', { 'fontawesome': 'fa-image' })
    config.addLabel('image', {
      en: 'Image',
      de: 'Bild'
    })
    config.addLabel('insert-image', {
      en: 'Insert image',
      de: 'Bild einfügen'
    })

    config.addDropHandler(DropImage)
    config.addFileProxy(ImageFileProxy)
  },
  ImageNode: ImageNode,
  ImageComponent: ImageComponent,
  ImageHTMLConverter: ImageHTMLConverter,
  InsertImageCommand: InsertImageCommand,
  InsertImageTool: InsertImageTool,
  DropImage: DropImage
}
