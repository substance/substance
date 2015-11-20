'use strict';

var oo = require('../../util/oo');
var DocumentedNode = require('./DocumentedNode');
var MemberContainerMixin = require('./MemberContainerMixin');

var MEMBER_CATEGORIES = [
  {name: 'classes', path: ['class']},
  {name: 'methods', path: ['method']},
  {name: 'properties', path: ['property']},
];

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

oo.inherit(ModuleNode, DocumentedNode);
oo.mixin(ModuleNode, MemberContainerMixin);

ModuleNode.static.name = 'module';

ModuleNode.static.defineSchema({
  parent: 'id',
  name: 'string',
  members: { type: ['array', 'property'], default: [] }, // ['model/documentHelpers.getAllAnnotations']
});

ModuleNode.static.isBlock = true;

module.exports = ModuleNode;
