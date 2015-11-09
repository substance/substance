'use strict';

var Node = require('../../model/DocumentNode');

var MetaNode = Node.extend({
  name: 'meta',
  properties: {
    description: 'string', // HTML
    repository: 'string', // https://github.com/substance/substance
    sha: 'string',
  }
});


module.exports = MetaNode;