import DocumentNode from './DocumentNode'
import ContainerMixin from './ContainerMixin'

/*
  A Container represents a list of nodes.

  While most editing occurs on a property level (such as editing text),
  other things happen on a node level, e.g., breaking or mergin nodes,
  or spanning annotations so called ContainerAnnotations.
*/
class Container extends ContainerMixin(DocumentNode) {
  constructor (...args) {
    super(...args)

    // NOTE: we are caching positions as they are queried very often,
    // whereas the number of changes to a container are quite rare.
    // The cache gets invalidated whenever the container is changed.
    this._enableCaching()
  }

  dispose () {
    this.document.off(this)
  }

  getContentPath () {
    return [this.id, 'nodes']
  }

  getContent () {
    return this.nodes
  }
}

Container.prototype._isContainer = true

Container.schema = {
  type: 'container',
  nodes: { type: ['array', 'id'], default: [] }
}

export default Container
