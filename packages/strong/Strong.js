'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Strong() {
  Strong.super.apply(this, arguments);
}

PropertyAnnotation.extend(Strong);

Strong.static.name = "strong";

module.exports = Strong;
