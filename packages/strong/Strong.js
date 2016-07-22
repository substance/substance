'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');
var Fragmenter = require('../../model/Fragmenter');

function Strong() {
  Strong.super.apply(this, arguments);
}

PropertyAnnotation.extend(Strong);

Strong.type = "strong";

// a hint that makes in case of overlapping annotations that this
// annotation gets fragmented more often
Strong.fragmentation = Fragmenter.ANY;

module.exports = Strong;