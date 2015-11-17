'use strict';

var BlockNode = require('../../model/BlockNode');

var Embed = BlockNode.extend();

Embed.static.name = "embed";

Embed.static.schema = {
  src: { type: 'string' },
  html: { type: 'string', volatile: true }  // Generated HTML
};

module.exports = Embed;
