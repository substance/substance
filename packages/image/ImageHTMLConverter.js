/*
 * HTML converter for Paragraphs.
 */
export default {

  type: 'image',
  tagName: 'img',

  import: function(el, node, converter) {
    let imageFile = converter.createNode({
      id: 'file-'+node.id,
      type: 'file',
      fileType: 'image',
      url: el.attr('src')
    })
    node.imageFile = imageFile.id
  },

  export: function(node, el) {
    let imageFile = node.document.get(node.imageFile)
    el.attr('src', imageFile.getUrl())
  }
}
