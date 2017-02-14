/*
 * HTML converter for Paragraphs.
 */
export default {

  type: 'link',
  tagName: 'a',

  import: function(el, node) {
    node.url = el.attr('href')
    node.title = el.attr('title')
  },

  export: function(link, el) {
    el.attr('href', link.url)
    if (link.title) {
      el.attr('title', link.title)
    }
  }

}
