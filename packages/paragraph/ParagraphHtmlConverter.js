'use strict';

var $$ = require('../../ui/Component').$$;

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: 'paragraph',
  tagName: 'p',

  import: function(el, node, converter) {
    node.content = converter.annotatedText(el, [id, 'content']);
  },

  export: function(node, el, converter) {
    el.append(converter.annotatedText([id, 'content']));
  }

};
