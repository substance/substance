'use strict';

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: "heading",

  matchElement: function(el) {
    return /^h\d$/.exec(el.tagName);
  },

  import: function(el, node, converter) {
    node.level = Number(el.tagName[1]);
    node.content = converter.annotatedText(el, [node.id, 'content']);
  },

  export: function(node, el, converter) {
    el.tagName = 'h'+node.level;
    el.append(
      converter.annotatedText([node.id, 'content'])
    );
  }

};
