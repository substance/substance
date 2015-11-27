'use strict';

/*
 * XML converter for Images.
 */
module.exports = {

  type: 'image',
  tagName: 'image',

  import: function(el, node) {
    node.src = el.attr('src');
    node.previewSrc = el.attr('data-preview-src');
  },

  export: function(node, el) {
    el.attr('src', node.src)
      .attr('data-preview-src', node.previewSrc)
      // HACK: We add a content to the image element so el.outerHTML
      // returns `<image></image>` and not `<image>` which is invalid XML
      .append(' '); 
  }
};
