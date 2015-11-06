'use strict';

var Node = require('../../model/DocumentNode');

var ObjectNode = Node.extend({
  name: 'object',
  properties: {
    name: 'string',
    props: ['array', 'property'], // ['model/documentHelpers.getAllAnnotations']
    description: 'string', // HTML
  }
});


ObjectNode.static.blockType = true;

module.exports = ObjectNode;
