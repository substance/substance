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
    var id = converter.defaultId(el, 'heading');
    var heading = {
      id: id,
      level: parseInt(''+el.tagName[1], 10),
      content: ''
    };
    heading.content = converter.annotatedText(el, [id, 'content']);
    return heading;
  },

  export: function(node, el, converter) {
    el.tagName = 'h' + node.level;
    el.append(
      converter.annotatedText([id, 'content'])
    );
  }

};
