'use strict';

var DocumentedNode = require('./DocumentedNode');

var ClassNode = DocumentedNode.extend({
  name: 'class',
  properties: {
    parent: 'id', // only set for nested classes, or classes of a module
    name: 'string',
    namespace: 'string',
    members: ['array', 'id'],
    params: ['array', 'object'],
    isAbstract: 'boolean',
    superClass: 'id', // when @extends is defined
  }
});

ClassNode.static.blockType = true;

module.exports = ClassNode;

