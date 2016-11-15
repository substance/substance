import AnnotationIndex from './AnnotationIndex'

class MarkerIndex extends AnnotationIndex {
  select(node) {
    return Boolean(node._isMarker)
  }
}

export default MarkerIndex
