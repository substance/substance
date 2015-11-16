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
  },

  // Defaults to the regular type property
  getSpecificType: function() {
    return this.type;
  }
});

DocumentedNode.static.blockType = true;

module.exports = DocumentedNode;

