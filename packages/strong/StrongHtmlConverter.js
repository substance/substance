'use strict';

/*
 * HTML converter for Strong.
 */
module.exports = {

  type: "strong",
  tagName: "strong",

  matchElement: function(el) {
    return el.is("strong, b");
  }

};
