'use strict';

var PropertyAnnotation = require('../../model/PropertyAnnotation');

var Link = PropertyAnnotation.extend({
  name: "link",
  displayName: "Link",
  properties: {
    url: 'string',
    title: 'string'
  }
});

module.exports = Link;
