'use strict';

var DocumentedNode = require('./DocumentedNode');
var MemberContainerMixin = require('./MemberContainerMixin');

var MEMBER_CATEGORIES = [
  {name: 'ctor', path: ['class', 'ctor']},
  {name: 'instance-methods', path: ['instance', 'method']},
  {name: 'instance-properties', path: ['instance', 'property']},
  {name: 'instance-events', path: ['instance', 'event']},

  {name: 'class-methods', path: ['class', 'method']},
  {name: 'class-properties', path: ['class', 'property']},
  {name: 'inner-classes', path: ['class', 'class']}
];

function ClassNode() {
  ClassNode.super.apply(this, arguments);
}

ClassNode.Prototype = function() {
  this.getSpecificType = function() {
    if (this.isAbstract) return 'abstract-class';
    return 'class';
  };

  this.getTocLevel = function() {
    return 2;
  };

  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };
};

DocumentedNode.extend(ClassNode, MemberContainerMixin);

ClassNode.static.name = 'class';
ClassNode.static.defineSchema({
  parent: 'id',
  name: 'string',
  members: { type: ['array', 'id'], default: [] },
  isAbstract: { type: 'boolean', default: false },
  isStatic: { type: 'boolean', default: false },
  superClass: { type: 'id', optional: true }, // only when @extends is defined
});

ClassNode.static.isBlock = true;

module.exports = ClassNode;

