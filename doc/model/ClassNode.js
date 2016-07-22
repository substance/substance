'use strict';

var DocumentedNode = require('./DocumentedNode');
var MemberContainerMixin = require('./MemberContainerMixin');

var MEMBER_CATEGORIES = {
  'ctor': {name: 'ctor', path: ['class', 'ctor']},
  'instance-methods': {name: 'instance-methods', path: ['instance', 'method']},
  'instance-properties': {name: 'instance-properties', path: ['instance', 'property']},
  'instance-events': {name: 'instance-events', path: ['instance', 'event']},
  'class-methods': {name: 'class-methods', path: ['class', 'method']},
  'class-properties': {name: 'class-properties', path: ['class', 'property']},
  'inner-classes': {name: 'inner-classes', path: ['class', 'class']}
};

function ClassNode() {
  ClassNode.super.apply(this, arguments);
}

ClassNode.Prototype = function() {
  this.getSpecificType = function() {
    if (this.isAbstract) return 'abstract-class';
    return 'class';
  };

  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };

  // var INHERITED = ['instance-methods', 'instance-properties', 'class-methods', 'class-properties'];
  var INHERITED = ['instance-methods', 'instance-properties'];

  this.getInheritedMembers = function(config) {
    var inheritedMembers = {};
    var doc = this.getDocument();
    var superClass = this.superClass ? doc.get(this.superClass) : null;
    if (superClass) {
      inheritedMembers = superClass.getInheritedMembers(config);
      INHERITED.forEach(function(group) {
        var members = superClass.getCategoryMembers(MEMBER_CATEGORIES[group], config);
        if (members.length > 0) {
          inheritedMembers[group] = inheritedMembers[group] || {};
          members.forEach(function(member) {
            inheritedMembers[group][member.id] = member;
          });
        }
      });
    }
    return inheritedMembers;
  };

};

DocumentedNode.extend(ClassNode, MemberContainerMixin);

ClassNode.define({
  type: 'class',
  parent: 'id',
  name: 'string',
  members: { type: ['array', 'id'], default: [] },
  isAbstract: { type: 'boolean', default: false },
  isStatic: { type: 'boolean', default: false },
  superClass: { type: 'id', optional: true }, // only when @extends is defined
});

ClassNode.isBlock = true;

module.exports = ClassNode;

