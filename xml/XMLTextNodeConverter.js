import XMLNodeConverter from './XMLNodeConverter'

export default
class TextNodeConverter extends XMLNodeConverter {

  import(el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
  }

  export(node, el, converter) {
    el.tagName = this.tagNameNS
    el.setAttributes(node.attributes)
    el.append(converter.annotatedText([node.id, 'content']))
  }

}
