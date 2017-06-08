import { isArrayEqual } from '../util'
import PropertyAnnotation from './PropertyAnnotation'

/*

  A Marker is a temporary annotation used by the application
  to mark or hightlight certain things, such as spell-errors, selections,
  etc.

  Note: we extend PropertyAnnotation to inherit the same API.
*/
class Marker extends PropertyAnnotation {

  _initialize(doc, props) {
    this.document = doc
    this.type = props.type
    if (!props.type) {
      throw new Error("'type' is mandatory")
    }
    if (!props.start) {
      throw new Error("'start' is mandatory")
    }
    if (!props.end) {
      throw new Error("'end' is mandatory")
    }
    Object.assign(this, props)
  }

  // TODO: we should use the Coordinate comparison API here
  containsSelection(sel) {
    if (sel.isNull()) return false;
    if (sel.isPropertySelection()) {
      return (isArrayEqual(this.start.path, sel.start.path) &&
        this.start.offset <= sel.start.offset &&
        this.end.offset >= sel.end.offset)
    } else {
      console.warn('Marker.contains() does not support other selection types.')
    }
  }

  get type() {
    return this._type
  }

  set type(type) {
    this._type = type
  }

}

// while having the same interface, Markers should still be treated differently, e.g. not go into the AnnotationIndex
Marker.prototype._isPropertyAnnotation = false
Marker.prototype._isMarker = true

export default Marker
