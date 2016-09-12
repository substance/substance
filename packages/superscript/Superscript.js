'use strict';

import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

function Superscript() {
  Superscript.super.apply(this, arguments);
}

PropertyAnnotation.extend(Superscript);

Superscript.type = 'superscript';

// hint for rendering in presence of overlapping annotations
Superscript.fragmentation = Fragmenter.ANY;

export default Superscript;