'use strict';

/*
 * HTML converter for Paragraphs.
 */
export default {

  type: 'image',
  tagName: 'img',

  import: function(el, node) {
    node.src = el.attr('src');
    node.previewSrc = el.attr('data-preview-src');
  },

  export: function(node, el) {
    el.attr('src', node.src)
      .attr('data-preview-src', node.previewSrc);
  }
};
