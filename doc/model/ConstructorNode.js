'use strict';

var DocumentedNode = require('./DocumentedNode');

var ConstructorNode = DocumentedNode.extend({
  // ATTENTION: we have to use 'ctor' has constructor is a key property of
  // every object
  name: 'ctor',
  properties: {
    parent: 'id', // id of parent class or module
    name: 'string',
    params: ['array', 'object'],
    isPrivate: 'boolean',
  }
});

module.exports = ConstructorNode;
