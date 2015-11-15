'use strict';

var DocumentedNode = require('./DocumentedNode');

var ModuleNode = DocumentedNode.extend({
  name: 'module',
  properties: {
    parent: 'id',
    name: 'string',
    members: ['array', 'property'], // ['model/documentHelpers.getAllAnnotations']
  }
});

ModuleNode.static.blockType = true;

module.exports = ModuleNode;
