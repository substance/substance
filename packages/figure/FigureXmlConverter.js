'use strict';

var $$ = require('../../ui/Component').$$;
var each = require('lodash/collection/each');

/*
 * XML converter for Figure.
 */
module.exports = {

  type: "figure",

  matchElement: function(el) {
    return el.is('figure');
  },

  import: function(el, converter) {
    var id = converter.defaultId(el, 'fig');
    var figure = {
      type: this.type,
      id: id,
      title: "",
      caption: ""
    };
    each(el.children, function(child) {
      var tagName = child.tagName;
      switch(tagName) {
        case 'title':
        case 'caption':
          figure[tagName] = converter.annotatedText(child, [id, tagName]);
          break;
      }
    });
    return figure;
  },

  export: function(node, converter) {
    var id = node.id;
    var el = $$('figure').attr('id', id);
    el.append($$('title').append(
      converter.annotatedText([id, 'title']))
    );
    el.append(
      converter.exportElement(node.getContentNode())
    );
    el.append($$('caption').append(
      converter.annotatedText([id, 'caption']))
    );
    return el;
  },

};
