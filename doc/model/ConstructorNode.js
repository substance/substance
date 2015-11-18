'use strict';

var oo = require('../../util/oo');
var DocumentedNode = require('./DocumentedNode');

function ConstructorNode() {
  ConstructorNode.super.apply(this, arguments);
}

oo.inherit(ConstructorNode, DocumentedNode);

// ATTENTION: we have to use 'ctor' has constructor is a key property of
// every object
ConstructorNode.static.name = 'ctor';

ConstructorNode.static.defineSchema({
  parent: 'id', // id of parent class or module
  name: 'string',
  params: { type: ['array', 'object'], default: [] },
  isPrivate: { type: 'boolean', default: false },
});

module.exports = ConstructorNode;
