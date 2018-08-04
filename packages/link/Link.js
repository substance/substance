import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

export default class Link extends PropertyAnnotation {
  // in presence of overlapping annotations will try to render this as one element
  static get fragmentation () { return Fragmenter.SHOULD_NOT_SPLIT }

  static get autoExpandRight () { return false }
}

Link.schema = {
  type: 'link',
  title: { type: 'string', optional: true },
  url: { type: 'string', 'default': '' }
}
