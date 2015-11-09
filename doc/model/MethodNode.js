'use strict';

var Node = require('../../model/DocumentNode');

var MethodNode = Node.extend({
  name: 'method',
  properties: {
    parent: 'id', // id of parent class or module
    name: 'string',
    params: ['array', 'param'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    returns: 'object', // {type: 'model/Document', description: 'The updated document'}
    isStatic: 'boolean',
    isPrivate: 'boolean',
    description: 'string', // HTML
    example: 'string', // HTML
    sourceFile: 'string', // ui/Component.js
    sourceLine: 'number',  }
});

module.exports = MethodNode;
