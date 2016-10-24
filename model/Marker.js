import PropertyAnnotation from './PropertyAnnotation'

class Marker extends PropertyAnnotation {
  invalidate() {}
  remove() {
    this.getDocument().data.delete(this.id)
  }
}

// while having the same interface, Markers should still be treated differently, e.g. not go into the AnnotationIndex
Marker.prototype._isPropertyAnnotation = false
Marker.prototype._isMarker = true

export default Marker
