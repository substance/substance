'use strict';

import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

function Emphasis() {
  Emphasis.super.apply(this, arguments);
}

PropertyAnnotation.extend(Emphasis);

Emphasis.type = "emphasis";

// hint for rendering in presence of overlapping annotations
Emphasis.fragmentation = Fragmenter.ANY;

export default Emphasis;
