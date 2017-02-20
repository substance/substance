import PropertyAnnotation from './PropertyAnnotation'
import isArrayEqual from '../util/isArrayEqual'

class Marker extends PropertyAnnotation {

  // called when the text inside the marker is changed
  // e.g. a spell-error should be removed and spell-checking redone
  invalidate() {}

  // called when the marker gets deleted by MarkersManager
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
Marker.autoExpandRight = false
// TODO: I want to rename this class to CustomMarker
Marker.prototype._isCustomMarker = true

export default Marker
