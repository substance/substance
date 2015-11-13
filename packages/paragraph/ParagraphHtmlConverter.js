'use strict';

var $$ = require('../../ui/Component').$$;

/*
 * HTML converter for Paragraph.
 */
module.exports = {

  type: 'paragraph',
  tagName: 'p',

  import: function(el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content']);
  },

  export: function(node, el, converter) {
    el.append(converter.annotatedText([node.id, 'content']));
  }

};
