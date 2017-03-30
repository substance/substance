export default {

  type: 'emphasis',
  tagName: 'em',

  matchElement: function(el) {
    return el.is('em, i')
  }

}
