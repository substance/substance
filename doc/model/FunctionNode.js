'use strict';

var Node = require('../../model/DocumentNode');

var FunctionNode = Node.extend({
  name: 'function',
  properties: {
    name: 'string',
    namespace: 'string',
    static: 'boolean',
    params: ['array', 'object'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    description: 'string', // HTML String
    returns: 'object' // {type: 'model/Document', description: 'The updated document'}
  }
});

FunctionNode.static.blockType = true;

module.exports = FunctionNode;
