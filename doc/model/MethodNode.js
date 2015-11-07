'use strict';

var Node = require('../../model/DocumentNode');

var MethodNode = Node.extend({
  name: 'method',
  properties: {
    parent: 'id', // id of parent class or module
    name: 'string',
    params: ['array', 'param'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    description: 'string', // HTML
    isStatic: 'boolean',
    isPrivate: 'boolean',
    returns: 'object' // {type: 'model/Document', description: 'The updated document'}
  }
});

module.exports = MethodNode;
