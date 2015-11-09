'use strict';

var Node = require('../../model/DocumentNode');

var ModuleNode = Node.extend({
  name: 'module',
  properties: {
    name: 'string',
    namespace: 'string',
    members: ['array', 'property'], // ['model/documentHelpers.getAllAnnotations']
    description: 'string', // HTML
    sourceFile: 'string', // util/oo.js
    sourceLine: 'number'
}
});

ModuleNode.static.blockType = true;

module.exports = ModuleNode;
