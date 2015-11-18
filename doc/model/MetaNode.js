'use strict';

var oo = require('../../util/oo');
var Node = require('../../model/DocumentNode');

function MetaNode() {
  MetaNode.super.apply(this, arguments);
}

oo.inherit(MetaNode, Node);

MetaNode.static.name = 'meta';

MetaNode.static.defineSchema({
  description: 'string', // HTML
  repository: 'string', // https://github.com/substance/substance
  sha: 'string',
});

module.exports = MetaNode;