import { PropertyAnnotation, Fragmenter } from '../../model'

class Strong extends PropertyAnnotation {}

Strong.type = "strong"
Strong.fragmentation = Fragmenter.ANY

export default Strong
