'use strict';

/*
 * HTML converter for Blockquote.
 */
module.exports = {

  type: "figure",
  tagName: "figure",

  import: function(el, node, converter) {
    // title
    var titleEl = el.find('p[property="title"]');
    node.title = converter.annotatedText(titleEl, [node.id, 'title']);
    // content
    var contentEl = el.find('*[property="content"]');
    var contentNode = converter.convertElement(contentEl);
    node.content = contentNode.id;
    // caption
    var captionEl = el.finc('figcaption');
    node.caption = converter.annotatedText(captionEl, [node.id, 'caption']);
  },

  export: function(node, el, converter) {
    var $$ = converter.$$;
    // title
    el.append(
      $$('p')
        .attr('property', 'title')
        .append(
          converter.annotatedText([node.id, 'title'])
        )
    );
    // content
    el.append(
      converter.exportElement(node.getContentNode())
    );
    // caption
    el.append(
      $$('figcaption').append(
        converter.annotatedText([node.id, 'caption'])
      )
    );
  },

};
