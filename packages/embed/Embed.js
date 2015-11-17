'use strict';

var oo = require('../../util/oo');
var BlockNode = require('../../model/BlockNode');

function Embed() {
  Embed.super.apply(this, arguments);
}

oo.inherit(Embed, BlockNode);

Embed.static.name = "embed";

Embed.static.defineSchema({
  src: 'string',
  html: { type: 'string', 'volatile': true }  // Generated HTML
});

module.exports = Embed;
