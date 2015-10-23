'use strict';

var oo = require('../../util/oo');

function Operation() {

}

Operation.Prototype = function() {
  this.isOperation = true;
};

oo.initClass(Operation);

module.exports = Operation;