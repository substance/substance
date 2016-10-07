export default {

  matchElement: function(el) {
    return el.is('div[typeof=test]')
  },

  import: function(el, node) {
    node.boolVal = Boolean(el.data('boolVal'))
    node.stringVal = el.data('stringVal') || ""
    node.arrayVal = (el.data('arrayVal') || "").split(/\s*,\s*/)
    var script = el.find('script')
    if (script.length) {
      node.objectVal = JSON.parse(script.text())
    }
  },

  export: function(node, el, converter) {
    var $$ = converter.$$
    el.data('boolVal', node.boolVal)
      .data('stringVal', node.stringVal)
      .data('arrayVal', node.arrayVal.join(','))
      .append($$('script').text(JSON.stringify(node.objectVal)))
  },

}
