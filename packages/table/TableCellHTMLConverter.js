export default {

  type: 'table-cell',
  tagName: 'td',

  import: function(el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
    let colspan = el.attr('colspan')
    let rowspan = el.attr('rowspan')
    if (colspan) {
      node.colspan = Number(colspan)
    }
    if (rowspan) {
      node.rowspan = Number(rowspan)
    }
  },

  export: function(node, el, converter) {
    el.append(converter.annotatedText([node.id, 'content']))
    if (node.rowspan > 0) {
      el.attr('rowspan', node.rowspan)
    }
    if (node.colspan > 0) {
      el.attr('colspan', node.colspan)
    }
    return el
  }
}
