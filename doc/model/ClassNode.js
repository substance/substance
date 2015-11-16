'use strict';

var DocumentedNode = require('./DocumentedNode');

var MEMBER_CATEGORIES = [
  {name: 'ctor', path: ['class', 'ctor']},
  {name: 'instance-methods', path: ['instance', 'method']},
  {name: 'instance-properties', path: ['instance', 'property']},
  {name: 'instance-events', path: ['instance', 'event']},

  {name: 'class-methods', path: ['class', 'method']},
  {name: 'class-properties', path: ['class', 'property']},
  {name: 'inner-classes', path: ['class', 'class']}
];

var ClassNode = DocumentedNode.extend({
  name: 'class',
  properties: {
    parent: 'id',
    name: 'string',
    members: ['array', 'id'],
    isAbstract: 'boolean',
    isStatic: 'boolean',
    superClass: 'id', // when @extends is defined
  },
  getSpecificType: function() {
    if (this.isAbstract) return 'abstract-class';
    return 'class';
  },
  getTocLevel: function() {
    return 2;
  },

  getMemberCategories: function() {
    return MEMBER_CATEGORIES;
  }
});

ClassNode.static.blockType = true;

module.exports = ClassNode;

