'use strict';

import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

function Strong() {
  Strong.super.apply(this, arguments);
}

PropertyAnnotation.extend(Strong);

Strong.type = "strong";

// a hint that makes in case of overlapping annotations that this
// annotation gets fragmented more often
Strong.fragmentation = Fragmenter.ANY;

export default Strong;