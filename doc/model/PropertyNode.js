'use strict';

var DocumentedNode = require('./DocumentedNode');

var PropertyNode = DocumentedNode.extend({
  name: 'property',
  properties: {
    parent: 'id', // id of parent class or module
    name: 'string',
    dataType: 'string',
    isStatic: 'boolean',
  },
});

module.exports = PropertyNode;
