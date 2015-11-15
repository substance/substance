'use strict';

var DocumentedNode = require('./DocumentedNode');

var EventNode = DocumentedNode.extend({
  name: 'event',
  properties: {
    parent: 'id',
    name: 'string',
    namespace: 'string',
    params: ['array', 'object'], // [{name: 'doc', type: 'model/Document', description: 'A Substance document instance'}]
  }
});

EventNode.static.blockType = true;

module.exports = EventNode;
