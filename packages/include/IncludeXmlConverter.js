'use strict';

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: 'include',
  tagName: 'include',

  import: function(el, node, converter) {
    node.nodeId = el.attr('data-rid');
    node.nodeType = el.attr('data-rtype');
  },

  export: function(node, el) {
    el.attr('data-rtype', node.nodeType)
      .attr('data-rid', node.nodeId);
  }

};
