'use strict';

var DocumentedNode = require('./DocumentedNode');

function FunctionNode() {
  FunctionNode.super.apply(this, arguments);
}

DocumentedNode.extend(FunctionNode);

FunctionNode.define({
  type: 'function',
  parent: 'id',
  name: 'string',
  params: { type: ['array', 'object'], default: [] }, // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
  returns: { type: 'object', optional: true }, // {type: 'model/Document', description: 'The updated document'}
});

FunctionNode.isBlock = true;

module.exports = FunctionNode;
