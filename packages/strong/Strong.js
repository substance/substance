'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');
var Fragmenter = require('../../model/Fragmenter');

function Strong() {
  Strong.super.apply(this, arguments);
}

PropertyAnnotation.extend(Strong);

Strong.static.name = "strong";

// a hint that makes in case of overlapping annotations that this
// annotation gets fragmented more often
Strong.static.fragmentation = Fragmenter.ANY;

module.exports = Strong;