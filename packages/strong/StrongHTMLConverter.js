/*
 * HTML converter for Strong.
 */
export default {

  type: "strong",
  tagName: "strong",

  matchElement: function(el) {
    return el.is("strong, b")
  }

}
