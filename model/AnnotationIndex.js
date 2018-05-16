import isString from '../util/isString'
import isNumber from '../util/isNumber'
import filter from '../util/filter'
import map from '../util/map'
import TreeIndex from '../util/TreeIndex'
import DocumentIndex from './DocumentIndex'

/*
  Index for Annotations.

  @example
  Lets us look up existing annotations by path and type

  To get all annotations for the content of a text node

    var aIndex = doc.annotationIndex
    aIndex.get(["text_1", "content"])

  You can also scope for a specific range

    aIndex.get(["text_1", "content"], 23, 45)
*/
class AnnotationIndex extends DocumentIndex {
  constructor () {
    super()

    this.byPath = new TreeIndex()
    this.byType = new TreeIndex()
  }

  select (node) {
    return node.isPropertyAnnotation()
  }

  clear () {
    this.byPath.clear()
    this.byType.clear()
  }

  // TODO: use object interface? so we can combine filters (path and type)
  get (path, start, end, type) {
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

  create (anno) {
    const path = anno.start.path
    this.byType.set([anno.type, anno.id], anno)
    if (path && path.length > 0) {
      this.byPath.set(anno.start.path.concat([anno.id]), anno)
    }
  }

  delete (anno) {
    this._delete(anno.type, anno.id, anno.start.path)
  }

  _delete (type, id, path) {
    this.byType.delete([type, id])
    if (path && path.length > 0) {
      this.byPath.delete(path.concat([id]))
    }
  }

  update (node, path, newValue, oldValue) {
    // TODO: this should better be a coordinate op
    if (this.select(node) && path[1] === 'start' && path[2] === 'path') {
      this._delete(node.type, node.id, oldValue)
      this.create(node)
    }
  }
}

AnnotationIndex.filterByRange = function (start, end) {
  return function (anno) {
    var aStart = anno.start.offset
    var aEnd = anno.end.offset
    var overlap = (aEnd >= start)
    // Note: it is allowed to omit the end part
    if (isNumber(end)) {
      overlap = overlap && (aStart <= end)
    }
    return overlap
  }
}

export default AnnotationIndex
