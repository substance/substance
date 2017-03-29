import { InlineNode } from '../../model'

class InlineWrapper extends InlineNode {
  getWrappedNode() {
    return this.getDocument().get(this.wrappedNode)
  }
}

InlineWrapper.schema = {
  type: 'inline-wrapper',
  wrappedNode: 'id'
}

export default InlineWrapper
