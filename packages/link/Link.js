'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

var Link = PropertyAnnotation.extend();

Link.static.name = "link";

Link.static.schema = {
  title: { type: 'text', 'default': '' },
  url: { type: 'string', 'default': 'http://'}
};

module.exports = Link;
