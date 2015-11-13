'use strict';

/*
 * HTML converter for Blockquote.
 */
module.exports = {

  type: 'blockquote',
  tagName: 'blockquote',

  import: function(el, node, converter) {
    node.content = converter.annotatedText(el, [id, 'content']);
  },

  export: function(node, el, converter) {
    el.append(
      converter.annotatedText([id, 'content'])
    );
  },

};
