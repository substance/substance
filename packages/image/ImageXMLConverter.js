/*
 * XML converter for Images.
 */
export default {

  type: 'image',
  tagName: 'image',

  import: function(el, node) {
    node.src = el.attr('src')
    node.previewSrc = el.attr('preview-src')
  },

  export: function(node, el) {
    el.attr('src', node.src)
    if (node.previewSrc) el.attr('preview-src', node.previewSrc)
  }
}
