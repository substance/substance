'use strict';

var BlockNode = require('../../model/BlockNode');

function Embed() {
  Embed.super.apply(this, arguments);
}

BlockNode.extend(Embed);

Embed.static.name = "embed";

Embed.static.defineSchema({
  src: 'string',
  html: { type: 'string', 'volatile': true }  // Generated HTML
});

module.exports = Embed;
