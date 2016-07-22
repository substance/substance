'use strict';

var DocumentNode = require('../../model/DocumentNode');
var MemberContainerMixin = require('./MemberContainerMixin');

// Corresponds to a folder in substance
//
// - model
// - model/transform
// - ui

var MEMBER_CATEGORIES = {
  'modules': {name: 'modules', path: ['module']},
  'classes': {name: 'classes', path: ['class']},
  'functions': {name: 'functions', path: ['function']},
};

function NamespaceNode() {
  NamespaceNode.super.apply(this, arguments);
}

NamespaceNode.Prototype = function() {
  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };
};

DocumentNode.extend(NamespaceNode, MemberContainerMixin);

NamespaceNode.define({
  type: 'namespace',
  parent: { type: 'id', optional: true },
  name: 'string',
  description: { type: 'string', optional: true }, // HTML
  example: { type: 'string', optional: true }, // HTML
  tags: { type: ['array', 'object'], default: [] }, // [ { name: 'type', string: '...', html: '...'}]
  members: { type: ['array', 'id'], default: [] },
});

NamespaceNode.isBlock = true;

module.exports = NamespaceNode;
