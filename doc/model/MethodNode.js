'use strict';

var Node = require('../../model/DocumentNode');

var MethodNode = Node.extend({
  name: 'method',
  properties: {
    name: 'string',
    params: ['array', 'object'],
    description: 'string', // HTML
    returns: 'object' // {type: 'model/Document', description: 'The updated document'}
  }
});

MethodNode.static.blockType = true;

module.exports = MethodNode;
