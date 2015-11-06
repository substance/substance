'use strict';

var Node = require('../../model/DocumentNode');

var ModuleNode = Node.extend({
  name: 'module',
  properties: {
    name: 'string',
    members: ['array', 'property'], // ['model/documentHelpers.getAllAnnotations']
    description: 'string', // HTML
  }
});

ModuleNode.static.blockType = true;

module.exports = ModuleNode;
