/*
 * HTML converter for Blockquote.
 */
export default {

  type: 'emphasis',
  tagName: 'em',

  matchElement: function(el) {
    return el.is('em, i')
  }

}
