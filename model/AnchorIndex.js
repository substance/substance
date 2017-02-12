import filter from '../util/filter'
import TreeIndex from '../util/TreeIndex'
import DocumentIndex from './DocumentIndex'

class AnchorIndex extends DocumentIndex {

  constructor(doc) {
    super()

    this.doc = doc
    this.byPath = new TreeIndex.Arrays()
    this.byId = {}
  }

  select(node) {
    return (node._isContainerAnnotation)
  }

  reset(data) {
    this.byPath.clear()
    this.byId = {}
    this._initialize(data)
  }

  get(path, containerName) {
    var anchors = this.byPath.getAll(path)
    if (containerName) {
      return filter(anchors, function(anchor) {
        return (anchor.containerId === containerName)
      })
    } else {
      // return a copy of the array
      return anchors.slice(0)
    }
  }

  create(containerAnno) {
    var startAnchor = containerAnno.getStartAnchor()
    var endAnchor = containerAnno.getEndAnchor()
    this.byPath.add(startAnchor.path, startAnchor)
    this.byPath.add(endAnchor.path, endAnchor)
    this.byId[containerAnno.id] = containerAnno
  }

  delete(containerAnno) {
    var startAnchor = containerAnno.getStartAnchor()
    var endAnchor = containerAnno.getEndAnchor()
    this.byPath.remove(startAnchor.path, startAnchor)
    this.byPath.remove(endAnchor.path, endAnchor)
    delete this.byId[containerAnno.id]
  }

  update(node, path, newValue, oldValue) {
    if (this.select(node)) {
      var anchor = null
      if (path[1] === 'startPath') {
        anchor = node.getStartAnchor()
      } else if (path[1] === 'endPath') {
        anchor = node.getEndAnchor()
      } else {
        return
      }
      this.byPath.remove(oldValue, anchor)
      this.byPath.add(anchor.path, anchor)
    }
  }
}

export default AnchorIndex
