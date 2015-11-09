'use strict';

var DocumentedNode = require('./DocumentedNode');

var FunctionNode = DocumentedNode.extend({
  name: 'function',
  properties: {
    name: 'string',
    namespace: 'string',
    params: ['array', 'object'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    returns: 'object', // {type: 'model/Document', description: 'The updated document'}
  }
});

FunctionNode.static.blockType = true;

module.exports = FunctionNode;
