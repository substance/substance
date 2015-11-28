'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');
var Fragmenter = require('../../model/Fragmenter');

function Superscript() {
  Superscript.super.apply(this, arguments);
}

PropertyAnnotation.extend(Superscript);

Superscript.static.name = 'superscript';

// hint for rendering in presence of overlapping annotations
Superscript.static.fragmentation = Fragmenter.ANY;

module.exports = Superscript;