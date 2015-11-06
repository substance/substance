'use strict';

var Node = require('../../model/DocumentNode');

var ClassNode = Node.extend({
  name: 'class',
  properties: {
    name: 'string',
    members: ['array', 'id'],
    namespace: 'string',
    params: ['array', 'object'],
    // methods: ['array', 'method'],
    // Can not be named 'properties because of name conflict'
    // props: ['array', 'property'],
    description: 'string', // HTML
    isAbstract: 'boolean',
    parentClass: 'id',
  }
});

ClassNode.static.blockType = true;

module.exports = ClassNode;

