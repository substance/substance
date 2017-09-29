import XMLNodeConverter from './XMLNodeConverter'

export default
class XMLTextElementConverter extends XMLNodeConverter {

  import(el, node, converter) {
    node._content = converter.annotatedText(el, [node.id, '_content'], { preserveWhitespace: true })
  }

  export(node, el, converter) {
    el.tagName = this.tagNameNS
    el.setAttributes(node.attributes)
    el.append(converter.annotatedText([node.id, '_content']))
  }

}
