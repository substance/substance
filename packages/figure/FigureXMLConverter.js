'use strict';

var $$ = require('../../ui/Component').$$;
var each = require('lodash/collection/each');

/*
 * XML converter for Figure.
 */
module.exports = {

  type: 'figure',
  tagName: 'figure',

  import: function(el, node, converter) {
    each(el.children, function(child) {
      var tagName = child.tagName;
      switch(tagName) {
        case 'title':
        case 'caption':
          node[tagName] = converter.annotatedText(child, [node.id, tagName]);
          break;
      }
    });
  },

  export: function(node, el, converter) {
    el.append($$('title').append(
      converter.annotatedText([node.id, 'title']))
    );
    el.append(
      converter.exportElement(node.getContentNode())
    );
    el.append($$('caption').append(
      converter.annotatedText([node.id, 'caption']))
    );
    return el;
  },

};
