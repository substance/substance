import InlineNodeComponent from '../../packages/inline-node/InlineNodeComponent'


class InlineWrapperComponent extends InlineNodeComponent {

  getClassNames() {
    // ATTENTION: ATM it is necessary to add .sc-inline-node
    return 'sc-inline-wrapper sc-inline-node'
  }

  renderContent($$) {
    let node = this.props.node
    let doc = node.getDocument()

    let wrappedNode = doc.get(node.wrappedNode)
    let el;
    if (wrappedNode) {
      let componentRegistry = this.context.componentRegistry
      let ComponentClass = componentRegistry.get(wrappedNode.type)
      if (ComponentClass) {
        el = $$(ComponentClass, {
          disabled: this.props.disabled,
          node: wrappedNode,
        })
      } else {
        console.error('No component registered for node type' + wrappedNode.type)
      }
    } else {
      console.error('Could not find wrapped node: ' + node.wrappedNode)
    }
    return el
  }
}

export default InlineWrapperComponent
