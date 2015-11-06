'use strict';

var Node = require('../../model/DocumentNode');

var PropertyNode = Node.extend({
  name: 'property',
  properties: {
    name: 'string',
    type: 'string',
    static: 'boolean',
    description: 'string', // HTML
  }
});

module.exports = PropertyNode;
