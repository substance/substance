'use strict';

var Annotation = require('../../model/Annotation');

var Link = Annotation.extend({
  name: "link",
  displayName: "Link",
  properties: {
    url: 'string',
    title: 'string'
  }
});

module.exports = Link;
