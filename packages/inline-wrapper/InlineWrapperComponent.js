'use strict';

import InlineNodeComponent from '../../packages/inline-node/InlineNodeComponent'


class InlineWrapperComponent extends InlineNodeComponent {

  getClassNames() {
    // ATTENTION: ATM it is necessary to add .sc-inline-node
    return 'sc-inline-wrapper sc-inline-node';
  }

  renderContent($$) {
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
}

export default InlineWrapperComponent;
