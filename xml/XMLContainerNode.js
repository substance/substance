import { ContainerMixin } from '../model'
import XMLElementNode from './XMLElementNode'

export default class XMLContainerNode extends ContainerMixin(XMLElementNode) {

  getContentPath() {
    return [this.id, 'childNodes']
  }

  getContent() {
    return this.childNodes
  }

}

XMLContainerNode.prototype._elementType = 'container'

XMLContainerNode.type = 'container'

XMLContainerNode.schema = {}

XMLContainerNode.isBlock = true