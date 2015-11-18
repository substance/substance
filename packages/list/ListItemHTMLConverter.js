'use strict';

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: 'list-item',
  tagName: 'li',

  import: function(el, node, converter) {
    node.level = el.attr('data-level') || 1;
    node.content = converter.annotatedText(el, [node.id, 'content']);
  },

  export: function(node, el, converter) {
    el.attr('data-level', node.level)
      .append(converter.annotatedText([node.id, 'content']));
  }

};
