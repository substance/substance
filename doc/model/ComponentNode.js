'use strict';

var Node = require('../../model/DocumentNode');

var ComponentNode = Node.extend({
  name: 'class',
  properties: {
    name: 'string',
    props: ['array', 'object'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
    description: 'string' // HTML
  }
});

ComponentNode.static.blockType = true;

module.exports = ComponentNode;
