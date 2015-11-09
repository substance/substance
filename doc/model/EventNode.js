'use strict';

var Node = require('../../model/DocumentNode');

var EventNode = Node.extend({
  name: 'event',
  properties: {
    name: 'string',
    namespace: 'string',
    params: ['array', 'object'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    description: 'string', // HTML String
    example: 'string', // HTML
    sourceFile: 'string', // model/transform/breakNode.js
    sourceLine: 'number',
  }
});

EventNode.static.blockType = true;

module.exports = EventNode;
