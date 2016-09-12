'use strict';

import PropertyAnnotation from '../../model/PropertyAnnotation'
import Fragmenter from '../../model/Fragmenter'

function Link() {
  Link.super.apply(this, arguments);
}

PropertyAnnotation.extend(Link);

Link.define({
  type: "link",
  title: { type: 'string', optional: true },
  url: { type: 'string', 'default': 'http://'}
});

// in presence of overlapping annotations will try to render this as one element
Link.fragmentation = Fragmenter.SHOULD_NOT_SPLIT;

export default Link;
