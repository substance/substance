import XMLNodeConverter from './XMLNodeConverter'

export default
class ElementNodeConverter extends XMLNodeConverter {
  import (el, node, converter) {
    let it = converter.getChildNodeIterator(el)
    let childNodeIds = []
    while (it.hasNext()) {
      const childEl = it.next()
      if (childEl.isElementNode()) {
        let childNode = converter.convertElement(childEl)
        childNodeIds.push(childNode.id)
      }
    }
    node._childNodes = childNodeIds
  }

  export (node, el, converter) {
    el.tagName = this.tagNameNS
    el.attr(node.attributes)
    node.getChildren().forEach(childNode => {
      let childEl = converter.convertNode(childNode)
      el.appendChild(childEl)
    })
  }
}
