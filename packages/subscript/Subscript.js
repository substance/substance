import { PropertyAnnotation, Fragmenter } from '../../model'

class Subscript extends PropertyAnnotation {}

Subscript.type = 'subscript'

// hint for rendering in presence of overlapping annotations
Subscript.fragmentation = Fragmenter.ANY

export default Subscript
