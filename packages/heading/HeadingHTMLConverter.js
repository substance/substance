export default {

  type: "heading",

  matchElement: function(el) {
    return /^h\d$/.exec(el.tagName)
  },

  import: function(el, node, converter) {
    node.level = Number(el.tagName[1])
    node.textAlign = el.attr('data-text-align')
    node.content = converter.annotatedText(el, [node.id, 'content'])
  },

  export: function(node, el, converter) {
    el.tagName = 'h'+node.level
    if (node.textAlign) {
      el.attr('data-text-align', node.textAlign)
    }
    el.append(
      converter.annotatedText([node.id, 'content'])
    )
  }

}
