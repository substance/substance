'use strict';

var oo = require('../../util/oo');
var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Strong() {
  Strong.super.apply(this, arguments);
}

oo.inherit(Strong, PropertyAnnotation);

Strong.static.name = "strong";

module.exports = Strong;
