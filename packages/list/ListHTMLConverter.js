/*
 * HTML converter for Lists.
 */
export default {

  type: "list",

  matchElement: function(el) {
    return el.is('ul') || el.is('ol')
  },

  import: function(el, node, converter) {
    if (el.is('ol')) {
      node.ordered = true
    }
    let itemEls = el.findAll('li')
    itemEls.forEach(function(li) {
      let listItem = converter.convertElement(li)
      node.items.push(listItem.id)
    })
  },

  export: function(node, el, converter) {
    let $$ = converter.$$
    el.tagName = node.ordered ? 'ol' : 'ul'
    node.getItems().forEach(function(item) {
      el.append($$('li').append(converter.annotatedText(item.getTextPath())))
    })
    return el
  }
}
