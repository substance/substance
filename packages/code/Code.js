'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Code() {
  Code.super.apply(this, arguments);
}
PropertyAnnotation.extend(Code);

Code.type = 'code';

module.exports = Code;