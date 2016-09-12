'use strict';

import InlineNodeComponent from '../../ui/InlineNodeComponent'

function InlineWrapperComponent() {
  InlineWrapperComponent.super.apply(this, arguments);
}

InlineWrapperComponent.Prototype = function() {

  this.getClassNames = function() {
    // ATTENTION: ATM it is necessary to add .sc-inline-node
    return 'sc-inline-wrapper sc-inline-node';
  };

  this.renderContent = function($$) {
    var node = this.props.node;
    var doc = node.getDocument();
    var wrappedNode = doc.get(node.wrappedNode);
    var el;
    if (wrappedNode) {
      var componentRegistry = this.context.componentRegistry;
      var ComponentClass = componentRegistry.get(wrappedNode.type);
      if (ComponentClass) {
        el = $$(ComponentClass, {
          disabled: this.isDisabled(),
          node: wrappedNode,
        }).ref('wrappedNode');
      } else {
        console.error('No component registered for node type' + wrappedNode.type);
      }
    } else {
      console.error('Could not find wrapped node: ' + node.wrappedNode);
    }
    return el;
  };

};

InlineNodeComponent.extend(InlineWrapperComponent);

export default InlineWrapperComponent;
