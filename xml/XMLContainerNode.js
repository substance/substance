import ContainerMixin from '../model/ContainerMixin'
import XMLElementNode from './XMLElementNode'

export default class XMLContainerNode extends ContainerMixin(XMLElementNode) {
  getContentPath () {
    return [this.id, '_childNodes']
  }

  getContent () {
    return this._childNodes
  }

  isContainer () {
    return true
  }

  appendChild (child) {
    super.show(child.id)
  }
}

XMLContainerNode.prototype._elementType = 'container'

XMLContainerNode.type = 'container'

XMLContainerNode.schema = {}

XMLContainerNode.isBlock = true
