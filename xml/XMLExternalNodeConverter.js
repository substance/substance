import XMLNodeConverter from './XMLNodeConverter'

/*
  ElementNodes have attributes and children.
*/
export default
class ExternalNodeConverter extends XMLNodeConverter {

  import(el, node, converter) {
    node.xml = el.innerHTML
  }

  export(node, el, converter) {
    el.tagName = this.tagNameNS
    el.setAttributes(node.attributes)
    el.innerHTML = node.xml
  }

}
