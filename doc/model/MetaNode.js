'use strict';

var Node = require('../../model/DocumentNode');

var MetaNode = Node.extend({
  name: 'meta',
  properties: {
    title: 'string',
    authors: ['array', 'string'],
    abstract: 'string'
  }
});


module.exports = MetaNode;