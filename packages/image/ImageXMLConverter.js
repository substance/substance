'use strict';

/*
 * XML converter for Images.
 */
module.exports = {

  type: 'image',
  tagName: 'image',

  import: function(el, node) {
    node.src = el.attr('src');
    node.previewSrc = el.attr('preview-src');
  },

  export: function(node, el) {
    el.attr('src', node.src)
      .attr('preview-src', node.previewSrc);
  }
};
