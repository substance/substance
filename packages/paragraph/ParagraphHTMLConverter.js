export default {

  type: 'paragraph',
  tagName: 'p',

  import: function (el, node, converter) {
    let textAlign = el.attr('data-text-align')
    node.textAlign = textAlign || 'left'
    node.content = converter.annotatedText(el, [node.id, 'content'])
  },

  export: function (node, el, converter) {
    // Only serialize when not left-aligned
    if (node.textAlign !== 'left') {
      el.attr('data-text-align', node.textAlign)
    }
    el.append(converter.annotatedText([node.id, 'content']))
  }

}
