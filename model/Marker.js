import PropertyAnnotation from './PropertyAnnotation'

class Marker extends PropertyAnnotation {

  invalidate() {
    // nothing by default
  }

  remove() {
    let doc = this.getDocument()
    doc._markers._removeMarker(this)
  }

}

export default Marker
