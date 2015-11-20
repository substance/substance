'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Emphasis() {
  Emphasis.super.apply(this, arguments);
}

PropertyAnnotation.extend(Emphasis);

Emphasis.static.name = "emphasis";

module.exports = Emphasis;
