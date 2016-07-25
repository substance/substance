'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');
var Fragmenter = require('../../model/Fragmenter');

function Superscript() {
  Superscript.super.apply(this, arguments);
}

PropertyAnnotation.extend(Superscript);

Superscript.type = 'superscript';

// hint for rendering in presence of overlapping annotations
Superscript.fragmentation = Fragmenter.ANY;

module.exports = Superscript;