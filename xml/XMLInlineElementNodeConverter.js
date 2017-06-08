import XMLNodeConverter from './XMLNodeConverter'

export default
class InlineElementNodeConverter extends XMLNodeConverter {

  import() {}

  export(node, el) {
    el.tagName = this.tagNameNS
    el.setAttributes(node.attributes)
  }

}