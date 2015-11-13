'use strict';

var $$ = require('../../ui/Component').$$;

/*
 * HTML converter for Codeblock.
 */
module.exports = {

  type: 'codeblock',
  tagName: 'pre',

  import: function(el, node, converter) {
    var codeEl = el.find('code');
    if (codeEl) {
      node.content = converter.annotatedText(codeEl, [id, 'content']);
    }
  },

  export: function(node, el, converter) {
    el.append(
      $$('code').append(
        converter.annotatedText([id, 'content'])
      )
    );
  },

};
