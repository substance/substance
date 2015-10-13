'use strict';

var Substance = require('../basics');

function Operation() {
  
}

Operation.Prototype = function() {
  this.isOperation = true;
};

Substance.initClass(Operation);

module.exports = Operation;