'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Superscript() {
  Superscript.super.apply(this, arguments);
}

PropertyAnnotation.extend(Superscript);
Superscript.static.name = 'superscript';
module.exports = Superscript;