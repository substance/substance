'use strict';

var DocumentedNode = require('./DocumentedNode');

var MEMBER_CATEGORIES = [
  {name: 'classes', path: ['class']},
  {name: 'methods', path: ['method']},
  {name: 'properties', path: ['property']},
];

var ModuleNode = DocumentedNode.extend({
  name: 'module',
  properties: {
    parent: 'id',
    name: 'string',
    members: ['array', 'property'], // ['model/documentHelpers.getAllAnnotations']
  },

  getTocLevel: function() {
    return 2;
  },

  getMemberCategories: function() {
    return MEMBER_CATEGORIES;
  }
});

ModuleNode.static.blockType = true;

module.exports = ModuleNode;
