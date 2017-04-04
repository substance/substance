import { isString, filter, map, TreeIndex } from '../util'
import DocumentIndex from './DocumentIndex'

class ContainerAnnotationIndex extends DocumentIndex {

  constructor() {
    super()
    this.byId = new TreeIndex()
  }

  select(node) {
    return Boolean(node._isContainerAnnotation)
  }

  clear() {
    this.byId.clear()
  }

  get(containerId, type) {
    var annotations = map(this.byId.get(containerId))
    if (isString(type)) {
      annotations = filter(annotations, DocumentIndex.filterByType)
    }
    return annotations
  }

  create(anno) {
    this.byId.set([anno.containerId, anno.id], anno)
  }

  delete(anno) {
    this.byId.delete([anno.containerId, anno.id])
  }

  update(node, path, newValue, oldValue) { // eslint-disable-line
    // TODO should we support moving a container anno from one container to another?
  }

}

export default ContainerAnnotationIndex
