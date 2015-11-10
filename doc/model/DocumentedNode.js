'use strict';

var Node = require('../../model/DocumentNode');

var DocumentedNode = Node.extend({
  name: 'source-code',
  properties: {
    description: 'string', // HTML
    example: 'string', // HTML
    sourceFile: 'string', // ui/Component.js
    sourceLine: 'number',
    tags: ['array', 'object'], // [ { name: 'type', string: '...', html: '...'}]
  }
});

DocumentedNode.static.blockType = true;

module.exports = DocumentedNode;

