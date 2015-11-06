'use strict';

var Node = require('../../model/DocumentNode');

var ClassNode = Node.extend({
  name: 'class',
  properties: {
    name: 'string',
    members: ['array', 'id'],
    namespace: 'string',
    // methods: ['array', 'method'],
    // Can not be named 'properties because of name conflict'
    // props: ['array', 'property'],
    description: 'string' // HTML
  }
});

ClassNode.static.blockType = true;

module.exports = ClassNode;

