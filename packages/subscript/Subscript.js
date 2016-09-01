'use strict';

import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

function Subscript() {
  Subscript.super.apply(this, arguments);
}

PropertyAnnotation.extend(Subscript);

Subscript.type = 'subscript';

// hint for rendering in presence of overlapping annotations
Subscript.fragmentation = Fragmenter.ANY;

export default Subscript;