'use strict';

var Node = require('../../model/DocumentNode');

var PropertyNode = Node.extend({
  name: 'property',
  properties: {
    parent: 'id', // id of parent class or module
    name: 'string',
    dataType: 'string',
    isStatic: 'boolean',
    description: 'string', // HTML
    example: 'string', // HTML
    sourceFile: 'string', // ui/Component.js
    sourceLine: 'number',
  },
});

module.exports = PropertyNode;
