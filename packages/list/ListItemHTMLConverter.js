/*
 * HTML converter for Lists.
 */
export default {

  type: "list-item",

  matchElement: function(el) {
    return el.is('li')
  },

  import: function(el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
  },

  export: function(node, el, converter) {
    el.append(converter.annotatedText(item.getTextPath()))
  }
}
