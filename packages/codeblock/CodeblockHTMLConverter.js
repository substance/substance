/*
 * HTML converter for Codeblock.
 */
export default {

  type: 'codeblock',
  tagName: 'pre',

  import: function(el, node, converter) {
    let codeEl = el.find('code')
    if (codeEl) {
      node.content = converter.annotatedText(codeEl, [node.id, 'content'], { preserveWhitespace: true })
    }
  },

  export: function(node, el, converter) {
    let $$ = converter.$$;
    el.append(
      $$('code').append(
        converter.annotatedText([node.id, 'content'])
      )
    )
  }

}
