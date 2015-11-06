'use strict';

var Node = require('../../model/DocumentNode');

var MethodNode = Node.extend({
  name: 'method',
  properties: {
    name: 'string',
    static: 'boolean',
    params: ['array', 'param'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    description: 'string', // HTML
    returns: 'object' // {type: 'model/Document', description: 'The updated document'}
  }
});

module.exports = MethodNode;
