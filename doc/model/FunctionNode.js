'use strict';

var Node = require('../../model/DocumentNode');

var FunctionNode = Node.extend({
  name: 'function',
  properties: {
    name: 'string',
    namespace: 'string',
    params: ['array', 'object'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    returns: 'object', // {type: 'model/Document', description: 'The updated document'}
    description: 'string', // HTML String
    example: 'string', // HTML
    sourceFile: 'string', // model/transform/breakNode.js
    sourceLine: 'number',
  }
});

FunctionNode.static.blockType = true;

module.exports = FunctionNode;
