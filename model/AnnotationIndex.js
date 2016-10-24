import isString from 'lodash/isString'
import isNumber from 'lodash/isNumber'
import filter from 'lodash/filter'
import map from '../util/map'
import TreeIndex from '../util/TreeIndex'
import DocumentIndex from './DocumentIndex'

// PropertyAnnotation Index
// ----------------
//
// Lets us look up existing annotations by path and type
//
// To get all annotations for the content of a text node
//
//    var aIndex = doc.annotationIndex
//    aIndex.get(["text_1", "content"])
//
// You can also scope for a specific range
//
//    aIndex.get(["text_1", "content"], 23, 45)

class AnnotationIndex extends DocumentIndex {

  constructor() {
    super()

    this.byPath = new TreeIndex()
    this.byType = new TreeIndex()
  }

  get property() { return "path" }

  select(node) {
    return Boolean(node._isPropertyAnnotation)
  }

  reset(data) {
    this.byPath.clear()
    this.byType.clear()
    this._initialize(data)
  }

  // TODO: use object interface? so we can combine filters (path and type)
  get(path, start, end, type) {
    var annotations
    if (isString(path) || path.length === 1) {
      annotations = this.byPath.getAll(path) || {}
    } else {
      annotations = this.byPath.get(path)
    }
    annotations = map(annotations)
    if (isNumber(start)) {
      annotations = filter(annotations, AnnotationIndex.filterByRange(start, end))
    }
    if (type) {
      annotations = filter(annotations, DocumentIndex.filterByType(type))
    }
    return annotations
  }

  create(anno) {
    this.byType.set([anno.type, anno.id], anno)
    this.byPath.set(anno.path.concat([anno.id]), anno)
  }

  delete(anno) {
    this.byType.delete([anno.type, anno.id])
    this.byPath.delete(anno.path.concat([anno.id]))
  }

  update(node, path, newValue, oldValue) {
    if (this.select(node) && path[1] === this.property) {
      this.delete({ id: node.id, type: node.type, path: oldValue })
      this.create(node)
    }
  }

}

AnnotationIndex.filterByRange = function(start, end) {
  return function(anno) {
    var aStart = anno.startOffset
    var aEnd = anno.endOffset
    var overlap = (aEnd >= start)
    // Note: it is allowed to omit the end part
    if (isNumber(end)) {
      overlap = overlap && (aStart <= end)
    }
    return overlap
  }
}

export default AnnotationIndex
