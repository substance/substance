'use strict';

var Component = require('../../ui/Component');

function InlineWrapperComponent() {
  InlineWrapperComponent.super.apply(this, arguments);
}

InlineWrapperComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var doc = node.getDocument();
    var el = $$('span').addClass('sc-inline-wrapper')
      .attr('data-id', node.id);
    var wrappedNode = doc.get(node.wrappedNode);
    if (wrappedNode) {
      var componentRegistry = this.context.componentRegistry;
      var ComponentClass = componentRegistry.get(wrappedNode.type);
      if (ComponentClass) {
        el.append($$(ComponentClass, {
          node: wrappedNode,
          disabled: this.props.disabled
        }));
      } else {
        console.error('No component registered for node type' + wrappedNode.type);
      }
    } else {
      console.error('Could not find wrapped node: ' + node.wrappedNode);
    }
    return el;
  };

};

Component.extend(InlineWrapperComponent);

module.exports = InlineWrapperComponent;
