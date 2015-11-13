'use strict';

/*
 * HTML converter for Blockquote.
 */
module.exports = {

  type: "strong",
  tagName: "strong",

  matchElement: function(el) {
    return el.is("strong, b");
  }

};
