export default {

  tagName: 'meta',
  type: 'meta',

  import: function(el, node, converter) {
    node.id = 'meta'
    var titleEl = el.find('title')
    if (titleEl) {
      node.title = converter.annotatedText(titleEl, ['meta', 'title'])
    } else {
      node.title = ''
    }
  },

  export: function(node, el, converter) {
    el.append(el.createElement('title').append(
      converter.annotatedText(['meta', 'title'])
    ))
  }

}
