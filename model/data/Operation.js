'use strict';

var OO = require('../../util/oo');

function Operation() {

}

Operation.Prototype = function() {
  this.isOperation = true;
};

OO.initClass(Operation);

module.exports = Operation;