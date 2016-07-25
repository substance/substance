'use strict';

var DocumentedNode = require('./DocumentedNode');

function ConstructorNode() {
  ConstructorNode.super.apply(this, arguments);
}

DocumentedNode.extend(ConstructorNode);

ConstructorNode.define({
  // ATTENTION: we have to use 'ctor' has constructor is a key property of
  // every object
  type: 'ctor',
  parent: 'id', // id of parent class or module
  name: 'string',
  params: { type: ['array', 'object'], default: [] },
  isPrivate: { type: 'boolean', default: false },
});

module.exports = ConstructorNode;
