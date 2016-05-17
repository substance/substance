'use strict';

/*
 * HTML converter for Codeblock.
 */
module.exports = {

  type: 'codeblock',
  tagName: 'pre',

  import: function(el, node, converter) {
    var codeEl = el.find('code');
    if (codeEl) {
      node.content = converter.annotatedText(codeEl, [node.id, 'content'], { preserveWhitespace: true });
    } else {
      node.content = converter.annotatedText(el, [node.id, 'content'], { preserveWhitespace: true });
    }
  },

  export: function(node, el, converter) {
    var $$ = converter.$$;
    el.append(
      converter.annotatedText([node.id, 'content'])
    );
  }

};
