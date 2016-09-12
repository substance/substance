'use strict';

import oo from '../../util/oo'

/*
  @class
*/
function Operation() {}

Operation.Prototype = function() {
  this.isOperation = true;
};

oo.initClass(Operation);

export default Operation;