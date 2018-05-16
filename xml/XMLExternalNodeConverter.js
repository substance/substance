import XMLNodeConverter from './XMLNodeConverter'

export default
class ExternalNodeConverter extends XMLNodeConverter {
  import (el, node) {
    node.xml = el.innerHTML
  }

  export (node, el) {
    el.tagName = this.tagNameNS
    el.setAttributes(node.attributes)
    el.innerHTML = node.xml
  }
}
