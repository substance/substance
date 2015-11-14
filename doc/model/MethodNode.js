'use strict';

var DocumentedNode = require('./DocumentedNode');

var MethodNode = DocumentedNode.extend({
  name: 'method',
  properties: {
    parent: 'id', // id of parent class or module
    name: 'string',
    params: ['array', 'object'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    returns: 'object', // {type: 'model/Document', description: 'The updated document'}
    isStatic: 'boolean',
    isPrivate: 'boolean',
  }
});

module.exports = MethodNode;
