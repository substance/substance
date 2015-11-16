'use strict';

/*
 * HTML converter for Paragraphs.
 */
module.exports = {

  type: "link",
  tagName: 'a',

  import: function(el, node, converter) {
    node.url = el.attr('href');
    node.title = el.attr('title');
    // Note: we need to call back the converter
    // that it can process the element's inner html.
    // We do not need it for the link itself, though
    // TODO: We should try to get rid of this
    converter.annotatedText(el);
  },

  export: function(link, el) {
    el.attr({
      href: link.url,
      title: link.title
    });
  }

};
