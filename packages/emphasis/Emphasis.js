'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');
var Fragmenter = require('../../model/Fragmenter');

function Emphasis() {
  Emphasis.super.apply(this, arguments);
}

PropertyAnnotation.extend(Emphasis);

Emphasis.type = "emphasis";

// hint for rendering in presence of overlapping annotations
Emphasis.fragmentation = Fragmenter.ANY;

module.exports = Emphasis;
