import PropertyAnnotation from './PropertyAnnotation'

class Marker extends PropertyAnnotation {

  invalidate() {
    // nothing by default
  }

  remove() {
    console.warn('TODO: remove Marker')
  }

}

export default Marker
