import isString from '../util/isString'
import filter from '../util/filter'
import map from '../util/map'
import TreeIndex from '../util/TreeIndex'
import DocumentIndex from './DocumentIndex'

export default class ContainerAnnotationIndex extends DocumentIndex {
  constructor () {
    super()
    this.byId = new TreeIndex()
  }

  select (node) {
    return node.isContainerAnnotation()
  }

  clear () {
    this.byId.clear()
  }

  get (containerPath, type) {
    var annotations = map(this.byId.get(String(containerPath)))
    if (isString(type)) {
      annotations = filter(annotations, DocumentIndex.filterByType)
    }
    return annotations
  }

  create (anno) {
    this.byId.set([String(anno.containerPath), anno.id], anno)
  }

  delete (anno) {
    this.byId.delete([String(anno.containerPath), anno.id])
  }

  update(node, path, newValue, oldValue) { // eslint-disable-line
    // TODO should we support moving a container anno from one container to another?
  }
}
