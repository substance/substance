'use strict';

var oo = require('../../util/oo');
var DocumentedNode = require('./DocumentedNode');

function FunctionNode() {
  FunctionNode.super.apply(this, arguments);
}

FunctionNode.Prototype = function() {

  this.getTocLevel = function() {
    return 2;
  };

};

oo.inherit(FunctionNode, DocumentedNode);

FunctionNode.static.name = 'function';

FunctionNode.static.defineSchema({
  parent: 'id',
  name: 'string',
  params: { type: ['array', 'object'], default: [] }, // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
  returns: { type: 'object', optional: true }, // {type: 'model/Document', description: 'The updated document'}
});

FunctionNode.static.isBlock = true;

module.exports = FunctionNode;
