'use strict';

var DocumentNode = require('../../model/DocumentNode');

function MetaNode() {
  MetaNode.super.apply(this, arguments);
}

DocumentNode.extend(MetaNode);

MetaNode.static.name = 'meta';

MetaNode.static.defineSchema({
  description: 'string', // HTML
  repository: 'string', // https://github.com/substance/substance
  sha: 'string',
});

module.exports = MetaNode;