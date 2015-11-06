'use strict';

var Node = require('../../model/DocumentNode');

var ClassNode = Node.extend({
  name: 'class',
  properties: {
    name: 'string',
    methods: ['array', 'method'],
    properties: ['array', 'property'],
    description: 'string' // HTML
  }
});

ClassNode.static.blockType = true;

module.exports = ClassNode;
