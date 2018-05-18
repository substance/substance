import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

export default class Link extends PropertyAnnotation {}

Link.schema = {
  type: 'link',
  title: { type: 'string', optional: true },
  url: { type: 'string', 'default': '' }
}

// in presence of overlapping annotations will try to render this as one element
Link.fragmentation = Fragmenter.SHOULD_NOT_SPLIT

Link.autoExpandRight = false
