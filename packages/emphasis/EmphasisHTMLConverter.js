'use strict';

/*
 * HTML converter for Blockquote.
 */
module.exports = {

  type: 'emphasis',
  tagName: 'em',

  matchElement: function(el) {
    return el.is('em, i');
  }

};
