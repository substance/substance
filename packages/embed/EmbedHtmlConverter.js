'use strict';

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: 'embed',
  tagName: 'embed',

  import: function(el, node) {
    node.src = el.attr('src');
    node.html = el.html();
  },

  export: function(node, el) {
    el.attr('src', node.src)
      .html(node.html);
  }

};
