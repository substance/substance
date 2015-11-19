'use strict';

var oo = require('../../util/oo');
var DocumentedNode = require('./DocumentedNode');

function PropertyNode() {
  PropertyNode.super.apply(this, arguments);
}

oo.inherit(PropertyNode, DocumentedNode);

PropertyNode.static.name = 'property';

PropertyNode.static.defineSchema({
  parent: 'id', // id of parent class or module
  name: 'string',
  dataType: { type: 'string', optional: true },
  isStatic: { type: 'boolean', default: false },
});

module.exports = PropertyNode;
