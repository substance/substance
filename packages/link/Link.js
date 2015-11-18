'use strict';

var oo = require('../../util/oo');
var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Link() {
  Link.super.apply(this, arguments);
}

oo.inherit(Link, PropertyAnnotation);

Link.static.name = "link";

Link.static.defineSchema({
  title: 'text',
  url: { type: 'string', 'default': 'http://'}
});

module.exports = Link;
