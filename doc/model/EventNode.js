'use strict';

var oo = require('../../util/oo');
var DocumentedNode = require('./DocumentedNode');

function EventNode() {
  EventNode.super.apply(this, arguments);
}

oo.inherit(EventNode, DocumentedNode);

EventNode.static.name = 'event';

EventNode.static.defineSchema({
  parent: 'id',
  name: 'string',
  params: { type: ['array', 'object'], default: [] } // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
});

EventNode.static.blockType = true;

module.exports = EventNode;
