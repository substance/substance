import DocumentNode from './DocumentNode'
import Coordinate from './Coordinate'
import documentHelpers from './documentHelpers'

class Annotation extends DocumentNode {

  constructor(doc, props) {
    super(doc, _normalizedProps(props))

    // wrap coordinates
    this.start = new Coordinate(this.start)
    this.end = new Coordinate(this.end)
  }

  get startPath() {
    console.warn('DEPRECATED: use Annotation.start.path instead.')
    return this.start.path
  }

  set startPath(path) {
    console.warn('DEPRECATED: use Annotation.start.path instead.')
    this.start.path = path
  }

  get startOffset() {
    console.warn('DEPRECATED: use Annotation.start.offset instead.')
    return this.start.offset
  }

  set startOffset(offset) {
    console.warn('DEPRECATED: use Annotation.start.offset instead.')
    this.start.offset = offset
  }

  get endPath() {
    console.warn('DEPRECATED: use Annotation.end.path instead.')
    return this.end.path
  }

  set endPath(path) {
    console.warn('DEPRECATED: use Annotation.end.path instead.')
    this.end.path = path
  }

  get endOffset() {
    console.warn('DEPRECATED: use Annotation.end.offset instead.')
    return this.end.offset
  }

  set endOffset(offset) {
    console.warn('DEPRECATED: use Annotation.end.offset instead.')
    this.end.offset = offset
  }

  /**
    Get the plain text spanned by this annotation.

    @return {String}
  */
  getText() {
    var doc = this.getDocument()
    if (!doc) {
      console.warn('Trying to use a Annotation which is not attached to the document.')
      return ""
    }
    return documentHelpers.getTextForSelection(doc, this.getSelection())
  }

  /**
    Determines if an annotation can be split e.g., when breaking a node.

    In these cases, a new annotation will be created attached to the created node.

    For certain annotation types,you may want to the annotation truncated
    rather than split, where you need to override this method returning `false`.
  */
  canSplit() {
    return true
  }

  /**
    If this annotation is an Anchor.

    Anchors are annotations with a zero width.
    For instance, ContainerAnnotation have a start and an end anchor,
    or rendered cursors are modeled as anchors.

    @returns {Boolean}
  */
  isAnchor() {
    return false
  }
}

Annotation.define({
  type: "annotation",
  start: "coordinate",
  end: "coordinate"
})

Annotation.prototype._isAnnotation = true

function _normalizedProps(props) {
  if (!props.hasOwnProperty('start')) {
    /*
      Instead of
        { path: [...], startOffset: 0, endOffset: 10 }
      use
        { start: { path: [], offset: 0 }, end: { path: [], offset: 10 } }
    */
    console.warn('DEPRECATED: create Annotation with "start" and "end" coordinate instead.')
    props = Object.assign({}, props)
    props.start = {
      path: props.startPath || props.path,
      offset: props.startOffset
    }
    props.end = {}
    if (props.hasOwnProperty('endPath')) {
      props.end.path = props.endPath
    } else {
      props.end.path = props.start.path
    }
    if (props.hasOwnProperty('endOffset')) {
      props.end.offset = props.endOffset
    } else {
      props.end.offset = props.start.offset
    }
    delete props.path
    delete props.startPath
    delete props.endPath
    delete props.startOffset
    delete props.endOffset
  } else if (props.hasOwnProperty('end') && !props.end.path) {
    props.end.path = props.start.path
  }
  return props
}

export default Annotation
