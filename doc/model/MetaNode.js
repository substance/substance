'use strict';

var DocumentNode = require('../../model/DocumentNode');

function MetaNode() {
  MetaNode.super.apply(this, arguments);
}

DocumentNode.extend(MetaNode);

MetaNode.define({
  type: 'meta',
  description: 'string', // HTML
  repository: 'string', // https://github.com/substance/substance
  sha: 'string',
});

module.exports = MetaNode;