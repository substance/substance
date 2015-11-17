'use strict';

var oo = require('../../util/oo');
var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Emphasis() {
  Emphasis.super.apply(this, arguments);
}

oo.inherit(Emphasis, PropertyAnnotation);

Emphasis.static.name = "emphasis";

module.exports = Emphasis;
