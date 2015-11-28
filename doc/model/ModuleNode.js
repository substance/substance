'use strict';

var DocumentedNode = require('./DocumentedNode');
var MemberContainerMixin = require('./MemberContainerMixin');

var MEMBER_CATEGORIES = {
  'classes': {name: 'classes', path: ['class']},
  'methods': {name: 'methods', path: ['method']},
  'properties': {name: 'properties', path: ['property']},
};

function ModuleNode() {
  ModuleNode.super.apply(this, arguments);
}

ModuleNode.Prototype = function() {

  this.getTocLevel = function() {
    return 2;
  };

  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };

};

DocumentedNode.extend(ModuleNode, MemberContainerMixin);

ModuleNode.static.name = 'module';

ModuleNode.static.defineSchema({
  parent: 'id',
  name: 'string',
  members: { type: ['array', 'property'], default: [] }, // ['model/documentHelpers.getAllAnnotations']
});

ModuleNode.static.isBlock = true;

module.exports = ModuleNode;
