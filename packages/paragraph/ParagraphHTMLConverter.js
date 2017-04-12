export default {

  type: 'paragraph',
  tagName: 'p',

  import: function(el, node, converter) {
    node.textAlign = el.attr('data-text-align')
    node.content = converter.annotatedText(el, [node.id, 'content'])
  },

  export: function(node, el, converter) {
    if (node.textAlign) {
      el.attr('data-text-align', node.textAlign)
    }
    el.append(converter.annotatedText([node.id, 'content']))
  }

}
