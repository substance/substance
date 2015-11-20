'use strict';

var oo = require('../../util/oo');
var Node = require('../../model/DocumentNode');
var MemberContainerMixin = require('./MemberContainerMixin');

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

function NamespaceNode() {
  NamespaceNode.super.apply(this, arguments);
}

NamespaceNode.Prototype = function() {

  this.getTocLevel = function() {
    return 1;
  };

  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };

  this.getTocName = function() {
    return this.name;
  };

};

oo.inherit(NamespaceNode, Node);
oo.mixin(NamespaceNode, MemberContainerMixin);

NamespaceNode.static.name = 'namespace';

NamespaceNode.static.defineSchema({
  parent: { type: 'id', optional: true },
  name: 'string',
  description: { type: 'string', optional: true }, // HTML
  example: { type: 'string', optional: true }, // HTML
  tags: { type: ['array', 'object'], default: [] }, // [ { name: 'type', string: '...', html: '...'}]
  members: { type: ['array', 'id'], default: [] },
});

NamespaceNode.static.isBlock = true;

module.exports = NamespaceNode;
