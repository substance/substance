'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

function Link() {
  Link.super.apply(this, arguments);
}

PropertyAnnotation.extend(Link);

Link.static.name = "link";

Link.static.defineSchema({
  title: { type: 'text', optional: true },
  url: { type: 'string', 'default': 'http://'}
});

module.exports = Link;
