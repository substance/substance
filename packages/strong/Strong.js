import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

class Strong extends PropertyAnnotation {}

Strong.type = "strong"
Strong.fragmentation = Fragmenter.ANY

export default Strong
