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
    node.level = parseInt(''+el.tagName[1], 10);
    node.content = converter.annotatedText(el, [node.id, 'content']);
  },

  export: function(node, el, converter) {
    var $$ = converter.$$;
    el = $$('h'+node.level).attr('data-id', node.id);
    el.append(
      converter.annotatedText([node.id, 'content'])
    );
    return el;
  }

};
