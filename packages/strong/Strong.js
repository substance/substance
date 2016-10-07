import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

class Strong extends PropertyAnnotation {}

Strong.type = "strong"

// a hint that makes in case of overlapping annotations that this
// annotation gets fragmented more often
Strong.fragmentation = Fragmenter.ANY

export default Strong
