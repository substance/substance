'use strict';

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: 'image',
  tagName: 'img',

  import: function(el, node) {
    node.src = el.attr('src');
    node.previewSrc = el.attr('data-preview-src');
  },

  export: function(node, el) {
    el.attr('src', node.src);
    if (node.previewSrc) el.attr('preview-src', node.previewSrc);
  }
};
