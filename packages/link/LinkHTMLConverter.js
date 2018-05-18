export default {

  type: 'link',
  tagName: 'a',

  import: function (el, node) {
    node.url = el.attr('href')
    node.title = el.attr('title')
  },

  export: function (link, el) {
    let url = link.url
    if (url) el.setAttribute('href', url)
    let title = link.title
    if (title) el.setAttribute('title', title)
  }

}
