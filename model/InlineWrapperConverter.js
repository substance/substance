'use strict';

module.exports = {
  type: 'inline-wrapper',
  import: function(el, node, converter) {
    // HACK monkey patching the context
    node.id = converter.nextId('inline-wrapper');
    var state = converter.state;
    state.popElementContext();
    state.pushElementContext(state.getCurrentElementContext().tagName);
    node.wrappedNode = converter.convertElement(el).id;
  },
  export: function(node, el, converter) {
    return converter.convertNode(node.wrappedNode);
  }
};
