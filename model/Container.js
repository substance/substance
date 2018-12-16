import DocumentNode from './DocumentNode'
import ContainerMixin from './ContainerMixin'

/*
  A Container represents a list of nodes.

  While most editing occurs on a property level (such as editing text),
  other things happen on a node level, e.g., breaking or mergin nodes,
  or spanning annotations so called ContainerAnnotations.
*/
export default class Container extends ContainerMixin(DocumentNode) {
  getContentPath () {
    return [this.id, 'nodes']
  }

  getContent () {
    return this.nodes
  }

  // TODO: find out if we really need this anymore
  get _isContainer () { return true }
}

Container.schema = {
  type: '@container',
  nodes: { type: ['array', 'id'], default: [], owned: true }
}
