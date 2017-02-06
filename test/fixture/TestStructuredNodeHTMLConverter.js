export default {

  matchElement: function(el) {
    return el.is('div[typeof=structured-node]')
  },

  import: function(el, node, converter) {
    node.title = converter.annotatedText(el.find('span[property=title]'), [node.id, 'title'])
    node.body = converter.annotatedText(el.find('span[property=body]'), [node.id, 'body'])
    node.caption = converter.annotatedText(el.find('span[property=caption]'), [node.id, 'caption'])
  },

  export: function(node, el, converter) {
    let $$ = converter.$$
    ;['title', 'body', 'caption'].forEach(function(name) {
      var child = $$('span')
          .attr('property', name)
          .append(converter.annotatedText([node.id, name]))
      el.append(child)
    })
  },

}
