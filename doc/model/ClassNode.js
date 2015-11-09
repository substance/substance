'use strict';

var Node = require('../../model/DocumentNode');

var ClassNode = Node.extend({
  name: 'class',
  properties: {
    parent: 'id', // only set for nested classes, or classes of a module
    name: 'string',
    namespace: 'string',
    members: ['array', 'id'],
    params: ['array', 'object'],
    isAbstract: 'boolean',
    // methods: ['array', 'method'],
    // Can not be named 'properties because of name conflict'
    // props: ['array', 'property'],
    description: 'string', // HTML
    example: 'string', // HTML
    sourceFile: 'string', // ui/Component.js
    sourceLine: 'number',
    superClass: 'id', // when @extends is defined
  }
});

ClassNode.static.blockType = true;

module.exports = ClassNode;

