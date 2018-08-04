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

  get _elementType () { return 'container' }

  static get isBlock () { return true }
}

XMLContainerNode.schema = {
  // TODO: use '@container' so that we do not clutter the namespace
  type: 'container'
}
