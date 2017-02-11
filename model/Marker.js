import PropertyAnnotation from './PropertyAnnotation'
import isArrayEqual from '../util/isArrayEqual'

class Marker extends PropertyAnnotation {
  invalidate() {}
  remove() {
    this.getDocument().data.delete(this.id)
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

}

// while having the same interface, Markers should still be treated differently, e.g. not go into the AnnotationIndex
Marker.prototype._isPropertyAnnotation = false
Marker.prototype._isMarker = true

export default Marker
