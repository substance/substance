'use strict';

import PropertyAnnotation from '../../model/PropertyAnnotation'

function Code() {
  Code.super.apply(this, arguments);
}
PropertyAnnotation.extend(Code);

Code.type = 'code';

export default Code;