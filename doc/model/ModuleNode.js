'use strict';

var DocumentedNode = require('./DocumentedNode');

var ModuleNode = DocumentedNode.extend({
  name: 'module',
  properties: {
    name: 'string',
    namespace: 'string',
    members: ['array', 'property'], // ['model/documentHelpers.getAllAnnotations']
  }
});

ModuleNode.static.blockType = true;

module.exports = ModuleNode;
