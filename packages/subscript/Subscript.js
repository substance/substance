'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Subscript() {
  Subscript.super.apply(this, arguments);
}

PropertyAnnotation.extend(Subscript);
Subscript.static.name = 'subscript';
module.exports = Subscript;