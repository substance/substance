'use strict';

var DocumentedNode = require('./DocumentedNode');

// Corresponds to a folder in substance
//
// - model
// - model/transform
// - ui

var MEMBER_CATEGORIES = [
  {name: 'modules', path: ['module']},
  {name: 'classes', path: ['class']},
  {name: 'functions', path: ['function']},
];

var NamespaceNode = DocumentedNode.extend({
  name: 'namespace',
  properties: {
    parent: 'id',
    members: ['array', 'id'],
    name: 'string',
    description: 'string' // HTML
  },

  getTocLevel: function() {
    return 1;
  },

  getMemberCategories: function() {
    return MEMBER_CATEGORIES;
  }

});

NamespaceNode.static.blockType = true;
NamespaceNode.static.components = [];


module.exports = NamespaceNode;
