'use strict';

var Node = require('../../model/DocumentNode');

// Corresponds to a folder in substance
//
// - model
// - model/transform
// - ui

var NamespaceNode = Node.extend({
  name: 'namespace',
  properties: {
    parent: 'id',
    members: ['array', 'id'],
    name: 'string',
    description: 'string' // HTML
  },
});

NamespaceNode.static.blockType = true;
NamespaceNode.static.components = [];


module.exports = NamespaceNode;
