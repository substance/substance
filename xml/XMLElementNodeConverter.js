import XMLNodeConverter from './XMLNodeConverter'

export default
class ElementNodeConverter extends XMLNodeConverter {

  import(el, node, converter) {
    let it = converter.getChildNodeIterator(el)
    let childNodes = []
    while(it.hasNext()) {
      const childEl = it.next()
      if (childEl.isElementNode()) {
        let childNode = converter.convertElement(childEl)
        childNodes.push(childNode.id)
      }
    }
    node.childNodes = childNodes
  }

  export(node, el, converter) {
    const doc = node.getDocument()
    el.tagName = this.tagNameNS
    el.setAttributes(node.attributes)
    el.childNodes.forEach((id) => {
      let childNode = doc.get(id)
      let childEl = converter.convertNode(childNode)
      el.appendChild(childEl)
    })
  }

}
