import InlineNode from '../../model/InlineNode'

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
